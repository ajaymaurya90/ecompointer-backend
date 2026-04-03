import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import {
    CustomerSource,
    CustomerStatus,
    CustomerType,
    InventoryTransactionType,
    OrderStatus,
    PaymentStatus,
    Prisma,
    SalesChannelType,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStorefrontOrderDto } from '../dto/create-storefront-order.dto';
import type { StorefrontCustomerJwt } from '../../auth/interfaces/storefront-customer-jwt.interface';

/**
 * ---------------------------------------------------------
 * STOREFRONT ORDERS SERVICE
 * ---------------------------------------------------------
 * Purpose:
 * Handles storefront checkout order creation and protected
 * customer-side order history access.
 *
 * Key Responsibilities:
 * 1. Validate storefront availability
 * 2. Create or reuse BO-scoped customer by email
 * 3. Build order + item snapshot data from checkout payload
 * 4. Deduct stock and write inventory transactions
 * 5. Return customer order history scoped to authenticated user
 * ---------------------------------------------------------
 */
@Injectable()
export class StorefrontOrdersService {
    constructor(private readonly prisma: PrismaService) { }

    /* =====================================================
       CREATE STOREFRONT ORDER
       ===================================================== */
    async create(
        brandOwnerId: string,
        dto: CreateStorefrontOrderDto,
    ) {
        // Ensure the storefront is active and guest checkout is allowed.
        await this.assertStorefrontCheckoutAvailable(brandOwnerId);

        // Ensure checkout has at least one line item.
        if (!dto.items?.length) {
            throw new BadRequestException('At least one product is required');
        }

        // Normalize email to keep customer matching stable across storefront orders.
        const email = dto.email.trim().toLowerCase();

        // Load or create BO-scoped customer record using storefront checkout identity.
        const customer = await this.findOrCreateStorefrontCustomer(brandOwnerId, {
            firstName: dto.firstName,
            lastName: dto.lastName,
            email,
            phone: dto.phone,
        });

        // Load all requested variants and ensure they belong to this BO storefront.
        const variantIds = dto.items.map((item) => item.productVariantId);

        const variants = await this.prisma.productVariant.findMany({
            where: {
                id: { in: variantIds },
                isActive: true,
                product: {
                    brandOwnerId,
                    isActive: true,
                },
            },
            include: {
                product: true,
                inventories: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });

        // Block checkout when any requested variant is invalid or outside BO scope.
        if (variants.length !== dto.items.length) {
            throw new BadRequestException(
                'Some selected products are invalid for this storefront',
            );
        }

        let subtotal = new Prisma.Decimal(0);
        let totalTax = new Prisma.Decimal(0);

        const orderItemsData: Prisma.OrderItemCreateWithoutOrderInput[] = [];
        const inventoryPlans: Array<{
            productVariantId: string;
            quantity: number;
            variantCurrentStock: number;
            hasInventoryRows: boolean;
            inventoryDeductions: Array<{
                inventoryId: string;
                locationId: string | null;
                deductQty: number;
                currentQuantity: number;
                currentAvailable: number;
            }>;
        }> = [];

        // Prepare item snapshots and inventory deduction plan for the full order.
        for (const requestedItem of dto.items) {
            const variant = variants.find(
                (entry) => entry.id === requestedItem.productVariantId,
            );

            if (!variant) {
                throw new BadRequestException(
                    `Variant ${requestedItem.productVariantId} not found`,
                );
            }

            if (requestedItem.quantity <= 0) {
                throw new BadRequestException(
                    `Quantity must be greater than 0 for SKU ${variant.sku}`,
                );
            }

            const quantity = requestedItem.quantity;
            const hasInventoryRows = variant.inventories.length > 0;

            const totalAvailableFromInventories = variant.inventories.reduce(
                (sum, inventory) => sum + inventory.availableQuantity,
                0,
            );

            const availableStock = hasInventoryRows
                ? totalAvailableFromInventories
                : variant.stock;

            // Prevent checkout beyond currently available stock.
            if (availableStock < quantity) {
                throw new BadRequestException(
                    `Insufficient stock for SKU ${variant.sku}. Requested ${quantity}, available ${availableStock}`,
                );
            }

            const unitPrice = new Prisma.Decimal(variant.retailGross);
            const lineSubtotal = unitPrice.mul(quantity);
            const taxRate = new Prisma.Decimal(variant.taxRate ?? 0);
            const taxAmount = lineSubtotal.mul(taxRate).div(100);
            const lineTotal = lineSubtotal.add(taxAmount);

            subtotal = subtotal.add(lineSubtotal);
            totalTax = totalTax.add(taxAmount);

            const variantLabel =
                [variant.size, variant.color].filter(Boolean).join(' ').trim() || null;

            orderItemsData.push({
                brandOwner: {
                    connect: { id: brandOwnerId },
                },
                productVariant: {
                    connect: { id: variant.id },
                },
                productId: variant.productId,
                productName: variant.product.name,
                productCode: variant.product.productCode,
                variantSku: variant.sku,
                variantLabel,
                quantity,
                unitPrice,
                taxRate,
                taxAmount,
                discountAmount: new Prisma.Decimal(0),
                lineSubtotal,
                lineTotal,
            });

            const inventoryDeductions: Array<{
                inventoryId: string;
                locationId: string | null;
                deductQty: number;
                currentQuantity: number;
                currentAvailable: number;
            }> = [];

            // Build per-location deduction plan when inventory rows exist.
            if (hasInventoryRows) {
                let remainingQty = quantity;

                for (const inventory of variant.inventories) {
                    if (remainingQty <= 0) {
                        break;
                    }

                    if (inventory.availableQuantity <= 0) {
                        continue;
                    }

                    const deductQty = Math.min(
                        inventory.availableQuantity,
                        remainingQty,
                    );

                    inventoryDeductions.push({
                        inventoryId: inventory.id,
                        locationId: inventory.locationId,
                        deductQty,
                        currentQuantity: inventory.quantity,
                        currentAvailable: inventory.availableQuantity,
                    });

                    remainingQty -= deductQty;
                }

                if (remainingQty > 0) {
                    throw new BadRequestException(
                        `Could not allocate inventory for SKU ${variant.sku}`,
                    );
                }
            }

            inventoryPlans.push({
                productVariantId: variant.id,
                quantity,
                variantCurrentStock: variant.stock,
                hasInventoryRows,
                inventoryDeductions,
            });
        }

        // Normalize shipping and discount values for final amount calculation.
        const shipping = new Prisma.Decimal(dto.shippingAmount || '0');
        const discount = new Prisma.Decimal(dto.discountAmount || '0');
        const totalAmount = subtotal.add(totalTax).add(shipping).sub(discount);

        // Build billing snapshot exactly as entered during checkout.
        const billingSnapshot = {
            billingFullName:
                dto.billingAddress.fullName ||
                `${dto.firstName} ${dto.lastName || ''}`.trim(),
            billingPhone: dto.billingAddress.phone || dto.phone || null,
            billingAddressLine1: dto.billingAddress.addressLine1,
            billingAddressLine2: dto.billingAddress.addressLine2 || null,
            billingLandmark: dto.billingAddress.landmark || null,
            billingCity: dto.billingAddress.city,
            billingDistrict: dto.billingAddress.district || null,
            billingState: dto.billingAddress.state || null,
            billingCountry: dto.billingAddress.country || null,
            billingPostalCode: dto.billingAddress.postalCode || null,
        };

        // Build shipping snapshot using dedicated shipping form or billing fallback.
        const resolvedShippingAddress =
            dto.sameAsBilling || !dto.shippingAddress
                ? dto.billingAddress
                : dto.shippingAddress;

        const shippingSnapshot = {
            shippingFullName:
                resolvedShippingAddress.fullName ||
                `${dto.firstName} ${dto.lastName || ''}`.trim(),
            shippingPhone: resolvedShippingAddress.phone || dto.phone || null,
            shippingAddressLine1: resolvedShippingAddress.addressLine1,
            shippingAddressLine2: resolvedShippingAddress.addressLine2 || null,
            shippingLandmark: resolvedShippingAddress.landmark || null,
            shippingCity: resolvedShippingAddress.city,
            shippingDistrict: resolvedShippingAddress.district || null,
            shippingState: resolvedShippingAddress.state || null,
            shippingCountry: resolvedShippingAddress.country || null,
            shippingPostalCode: resolvedShippingAddress.postalCode || null,
        };

        // Generate a readable order number for storefront checkout.
        const orderNumber = `WEB-${Date.now()}`;

        const createdOrder = await this.prisma.$transaction(async (tx) => {
            // Create main storefront order with all buyer and address snapshots.
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    brandOwner: {
                        connect: { id: brandOwnerId },
                    },
                    customer: {
                        connect: { id: customer.id },
                    },
                    buyerType: 'CUSTOMER',
                    salesChannel: SalesChannelType.DIRECT_WEBSITE,
                    buyerName: `${dto.firstName} ${dto.lastName || ''}`.trim(),
                    buyerEmail: email,
                    buyerPhone: dto.phone?.trim() || null,
                    currencyCode: 'INR',
                    subtotalAmount: subtotal,
                    discountAmount: discount,
                    taxAmount: totalTax,
                    shippingAmount: shipping,
                    totalAmount,
                    status: OrderStatus.PENDING,
                    paymentStatus: PaymentStatus.UNPAID,
                    notes: dto.notes?.trim() || null,

                    ...billingSnapshot,
                    ...shippingSnapshot,

                    items: {
                        create: orderItemsData,
                    },
                },
                include: {
                    items: true,
                },
            });

            // Deduct stock and record inventory transactions inside same DB transaction.
            for (const plan of inventoryPlans) {
                const newVariantStock = plan.variantCurrentStock - plan.quantity;

                await tx.productVariant.update({
                    where: { id: plan.productVariantId },
                    data: {
                        stock: newVariantStock,
                    },
                });

                if (plan.hasInventoryRows) {
                    for (const deduction of plan.inventoryDeductions) {
                        await tx.productInventory.update({
                            where: { id: deduction.inventoryId },
                            data: {
                                quantity: deduction.currentQuantity - deduction.deductQty,
                                availableQuantity:
                                    deduction.currentAvailable - deduction.deductQty,
                            },
                        });

                        await tx.inventoryTransaction.create({
                            data: {
                                brandOwnerId,
                                productVariantId: plan.productVariantId,
                                locationId: deduction.locationId,
                                transactionType:
                                    InventoryTransactionType.ORDER_CONFIRMED,
                                quantityChange: -deduction.deductQty,
                                balanceAfter:
                                    deduction.currentAvailable - deduction.deductQty,
                                referenceType: 'STOREFRONT_ORDER',
                                referenceId: order.id,
                                note: `Stock deducted for storefront order ${order.orderNumber}`,
                            },
                        });
                    }
                } else {
                    await tx.inventoryTransaction.create({
                        data: {
                            brandOwnerId,
                            productVariantId: plan.productVariantId,
                            transactionType:
                                InventoryTransactionType.ORDER_CONFIRMED,
                            quantityChange: -plan.quantity,
                            balanceAfter: newVariantStock,
                            referenceType: 'STOREFRONT_ORDER',
                            referenceId: order.id,
                            note: `Stock deducted for storefront order ${order.orderNumber}`,
                        },
                    });
                }
            }

            return order;
        });

        return {
            message: 'Storefront order created successfully',
            data: {
                id: createdOrder.id,
                orderNumber: createdOrder.orderNumber,
                status: createdOrder.status,
                paymentStatus: createdOrder.paymentStatus,
                totalAmount: createdOrder.totalAmount,
                createdAt: createdOrder.createdAt,
            },
        };
    }

    /* =====================================================
       GET CURRENT CUSTOMER ORDER LIST
       ===================================================== */
    async findMyOrders(customerJwt: StorefrontCustomerJwt) {
        // Load only orders belonging to the authenticated storefront customer.
        const orders = await this.prisma.order.findMany({
            where: {
                customerId: customerJwt.customerId,
                brandOwnerId: customerJwt.brandOwnerId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                items: {
                    select: {
                        id: true,
                        productName: true,
                        productCode: true,
                        variantSku: true,
                        variantLabel: true,
                        quantity: true,
                        unitPrice: true,
                        lineTotal: true,
                    },
                },
                payments: {
                    select: {
                        id: true,
                        amountPaid: true,
                        paymentDate: true,
                        paymentMethod: true,
                        referenceNo: true,
                        note: true,
                        createdAt: true,
                    },
                    orderBy: {
                        paymentDate: 'desc',
                    },
                },
            },
        });

        // Map order list into storefront account friendly payload.
        const data = orders.map((order) => {
            const totalPaid = order.payments.reduce(
                (sum, payment) => sum.add(payment.amountPaid),
                new Prisma.Decimal(0),
            );

            const pendingAmount = new Prisma.Decimal(order.totalAmount).sub(totalPaid);

            return {
                id: order.id,
                orderNumber: order.orderNumber,
                buyerName: order.buyerName,
                buyerEmail: order.buyerEmail,
                buyerPhone: order.buyerPhone,
                status: order.status,
                paymentStatus: order.paymentStatus,
                currencyCode: order.currencyCode,
                subtotalAmount: order.subtotalAmount,
                discountAmount: order.discountAmount,
                taxAmount: order.taxAmount,
                shippingAmount: order.shippingAmount,
                totalAmount: order.totalAmount,
                totalPaid,
                pendingAmount,
                itemCount: order.items.length,
                items: order.items,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            };
        });

        return {
            message: 'Storefront customer orders fetched successfully',
            data,
        };
    }

    /* =====================================================
       GET CURRENT CUSTOMER ORDER DETAIL
       ===================================================== */
    async findMyOrder(
        orderId: string,
        customerJwt: StorefrontCustomerJwt,
    ) {
        // Load one order only when it belongs to the authenticated storefront customer.
        const order = await this.prisma.order.findFirst({
            where: {
                id: orderId,
                customerId: customerJwt.customerId,
                brandOwnerId: customerJwt.brandOwnerId,
            },
            include: {
                brandOwner: {
                    select: {
                        id: true,
                        businessName: true,
                        phone: true,
                        logoUrl: true,
                        address: true,
                        city: true,
                        state: true,
                        country: true,
                    },
                },
                items: {
                    include: {
                        productVariant: {
                            select: {
                                id: true,
                                sku: true,
                                size: true,
                                color: true,
                                taxRate: true,
                                stock: true,
                                isActive: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                payments: {
                    orderBy: {
                        paymentDate: 'desc',
                    },
                },
            },
        });

        // Stop when order does not belong to current storefront customer.
        if (!order) {
            throw new NotFoundException('Storefront order not found');
        }

        const totalPaid = order.payments.reduce(
            (sum, payment) => sum.add(payment.amountPaid),
            new Prisma.Decimal(0),
        );

        const pendingAmount = new Prisma.Decimal(order.totalAmount).sub(totalPaid);

        return {
            message: 'Storefront customer order fetched successfully',
            data: {
                ...order,
                totalPaid,
                pendingAmount,
            },
        };
    }

    /* =====================================================
       HELPERS
       ===================================================== */
    private async assertStorefrontCheckoutAvailable(brandOwnerId: string) {
        // Load BO storefront flags before allowing public storefront checkout.
        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { id: brandOwnerId },
            select: {
                id: true,
                isActive: true,
                storefrontSetting: {
                    select: {
                        isStorefrontEnabled: true,
                        isGuestCheckoutEnabled: true,
                    },
                },
            },
        });

        // Stop when storefront owner does not exist.
        if (!brandOwner) {
            throw new NotFoundException('Storefront not found');
        }

        // Stop when BO is inactive.
        if (!brandOwner.isActive) {
            throw new BadRequestException('Storefront is not available');
        }

        // Stop when storefront is disabled by BO.
        if (brandOwner.storefrontSetting?.isStorefrontEnabled === false) {
            throw new BadRequestException('Storefront is disabled');
        }

        // Stop when guest checkout has been disabled.
        if (brandOwner.storefrontSetting?.isGuestCheckoutEnabled === false) {
            throw new BadRequestException(
                'Checkout is currently disabled for this storefront',
            );
        }
    }

    private async findOrCreateStorefrontCustomer(
        brandOwnerId: string,
        data: {
            firstName: string;
            lastName?: string;
            email: string;
            phone?: string;
        },
    ) {
        // Reuse BO-scoped customer record when same email already exists.
        const existingCustomer = await this.prisma.customer.findFirst({
            where: {
                brandOwnerId,
                email: data.email,
                isDeleted: false,
            },
            select: {
                id: true,
                brandOwnerId: true,
                customerCode: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                type: true,
                status: true,
                isActive: true,
            },
        });

        if (existingCustomer) {
            // Prevent order creation when matched customer record is inactive.
            if (!existingCustomer.isActive) {
                throw new UnauthorizedException(
                    'Customer account is inactive for this storefront',
                );
            }

            return existingCustomer;
        }

        // Generate readable customer code for new storefront-created customer.
        const customerCode = await this.generateCustomerCode(brandOwnerId);

        return this.prisma.customer.create({
            data: {
                customerCode,
                brandOwnerId,
                type: CustomerType.INDIVIDUAL,
                status: CustomerStatus.ACTIVE,
                source: CustomerSource.WEBSITE,
                firstName: data.firstName.trim(),
                lastName: data.lastName?.trim() || null,
                email: data.email,
                phone: data.phone?.trim() || null,
            },
            select: {
                id: true,
                brandOwnerId: true,
                customerCode: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                type: true,
                status: true,
                isActive: true,
            },
        });
    }

    private async generateCustomerCode(brandOwnerId: string) {
        // Count existing BO customers to generate next readable customer code.
        const totalCustomers = await this.prisma.customer.count({
            where: {
                brandOwnerId,
            },
        });

        const nextNumber = totalCustomers + 1;
        return `CUST-${String(nextNumber).padStart(5, '0')}`;
    }
}