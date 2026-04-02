import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    BuyerType,
    InventoryTransactionType,
    OrderStatus,
    PaymentStatus,
    Prisma,
    Role,
    SalesChannelType,
} from '@prisma/client';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { OrderQueryDto } from '../dto/order/order-query.dto';
import { UpdateOrderNotesDto } from '../dto/order/update-order-notes.dto';

type ActorScope = {
    role: Role;
    brandOwnerId?: string;
    shopOwnerId?: string;
};

@Injectable()
export class OrdersService {
    constructor(private readonly prisma: PrismaService) { }

    // Resolve the logged-in actor scope from the auth user.
    private async getActorScope(user: JwtUser): Promise<ActorScope> {
        if (user.role === Role.SUPER_ADMIN) {
            return { role: user.role };
        }

        if (user.role === Role.BRAND_OWNER) {
            const brandOwner = await this.prisma.brandOwner.findUnique({
                where: { userId: user.id },
                select: { id: true },
            });

            if (!brandOwner) {
                throw new ForbiddenException('Brand owner profile not found for current user');
            }

            return {
                role: user.role,
                brandOwnerId: brandOwner.id,
            };
        }

        if (user.role === Role.SHOP_OWNER) {
            const shopOwner = await this.prisma.shopOwner.findUnique({
                where: { userId: user.id },
                select: { id: true },
            });

            if (!shopOwner) {
                throw new ForbiddenException('Shop owner profile not found for current user');
            }

            return {
                role: user.role,
                shopOwnerId: shopOwner.id,
            };
        }

        throw new ForbiddenException('You are not allowed to access orders');
    }

    // Apply role-based order visibility.
    private applyOrderScope(where: Prisma.OrderWhereInput, actor: ActorScope): Prisma.OrderWhereInput {
        if (actor.role === Role.BRAND_OWNER) {
            return {
                AND: [
                    where,
                    { brandOwnerId: actor.brandOwnerId },
                ],
            };
        }

        if (actor.role === Role.SHOP_OWNER) {
            return {
                AND: [
                    where,
                    { shopOwnerId: actor.shopOwnerId },
                ],
            };
        }

        return where;
    }

    async create(dto: CreateOrderDto, user: JwtUser) {
        const actor = await this.getActorScope(user);

        const {
            buyerType,
            brandOwnerId,
            customerId,
            shopOwnerId,
            items,
            billingAddressId,
            shippingAddressId,
            shippingAmount = '0',
            discountAmount = '0',
            notes,
            salesChannel,
        } = dto;

        // Restrict create behavior by role before any expensive logic runs.
        if (actor.role === Role.BRAND_OWNER && actor.brandOwnerId !== brandOwnerId) {
            throw new ForbiddenException('You can create orders only for your own brand owner account');
        }

        if (actor.role === Role.SHOP_OWNER) {
            if (buyerType !== BuyerType.SHOP_OWNER) {
                throw new ForbiddenException('Shop owner can create only SHOP_OWNER orders');
            }

            if (shopOwnerId !== actor.shopOwnerId) {
                throw new ForbiddenException('Shop owner can create orders only for their own account');
            }
        }

        if (buyerType === BuyerType.CUSTOMER) {
            if (!customerId) {
                throw new BadRequestException('customerId is required for CUSTOMER order');
            }

            if (!billingAddressId) {
                throw new BadRequestException('billingAddressId is required for CUSTOMER order');
            }

            if (!shippingAddressId) {
                throw new BadRequestException('shippingAddressId is required for CUSTOMER order');
            }
        }

        if (buyerType === BuyerType.SHOP_OWNER && !shopOwnerId) {
            throw new BadRequestException('shopOwnerId is required for SHOP_OWNER order');
        }

        // Load brand owner order rules so shop-owner orders can be validated dynamically.
        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { id: brandOwnerId },
            select: {
                id: true,
                minShopOrderLineQty: true,
                minShopOrderCartQty: true,
                allowBelowMinLineQtyAfterCartMin: true,
            },
        });

        if (!brandOwner) {
            throw new NotFoundException('Brand owner not found');
        }

        // Validate shop-owner wholesale ordering rules from brand owner settings.
        if (buyerType === BuyerType.SHOP_OWNER) {
            const minLineQty = brandOwner.minShopOrderLineQty ?? 3;
            const minCartQty = brandOwner.minShopOrderCartQty ?? 10;
            const allowBelowMinLineQtyAfterCartMin =
                brandOwner.allowBelowMinLineQtyAfterCartMin ?? true;

            const totalCartQty = items.reduce((sum, item) => sum + item.quantity, 0);

            if (totalCartQty < minCartQty) {
                throw new BadRequestException(
                    `Shop owner order must have at least total quantity ${minCartQty}`,
                );
            }

            const shouldEnforceLineMin =
                !allowBelowMinLineQtyAfterCartMin || totalCartQty < minCartQty;

            if (shouldEnforceLineMin) {
                const invalidLine = items.find((item) => item.quantity < minLineQty);

                if (invalidLine) {
                    throw new BadRequestException(
                        `Each shop owner order line must have at least quantity ${minLineQty}`,
                    );
                }
            }
        }

        // Load buyer snapshot according to order type.
        let buyerName = '';
        let buyerEmail: string | null = null;
        let buyerPhone: string | null = null;

        if (buyerType === BuyerType.CUSTOMER) {
            const customer = await this.prisma.customer.findUnique({
                where: { id: customerId! },
            });

            if (!customer) {
                throw new NotFoundException('Customer not found');
            }

            if (customer.brandOwnerId !== brandOwnerId) {
                throw new BadRequestException('Customer does not belong to this brand owner');
            }

            buyerName = `${customer.firstName} ${customer.lastName ?? ''}`.trim();
            buyerEmail = customer.email ?? null;
            buyerPhone = customer.phone ?? null;
        }

        if (buyerType === BuyerType.SHOP_OWNER) {
            const shopOwner = await this.prisma.shopOwner.findUnique({
                where: { id: shopOwnerId! },
            });

            if (!shopOwner) {
                throw new NotFoundException('Shop owner not found');
            }

            const brandLink = await this.prisma.brandOwnerShop.findFirst({
                where: {
                    brandOwnerId,
                    shopOwnerId: shopOwnerId!,
                    isActive: true,
                },
            });

            if (!brandLink) {
                throw new BadRequestException('Shop owner is not connected with this brand owner');
            }

            buyerName = shopOwner.shopName;
            buyerEmail = shopOwner.email ?? null;
            buyerPhone = shopOwner.phone ?? null;
        }

        // Load all ordered variants and validate that all belong to the selected brand owner.
        const variantIds = items.map((item) => item.productVariantId);

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

        if (variants.length !== items.length) {
            throw new BadRequestException(
                'Some ordered variants are invalid or do not belong to this brand owner',
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

        // Prepare line snapshots and stock deduction plan for each ordered item.
        for (const requestedItem of items) {
            const variant = variants.find((entry) => entry.id === requestedItem.productVariantId);

            if (!variant) {
                throw new BadRequestException(`Variant ${requestedItem.productVariantId} not found`);
            }

            if (requestedItem.quantity <= 0) {
                throw new BadRequestException(`Quantity must be greater than 0 for SKU ${variant.sku}`);
            }

            const quantity = requestedItem.quantity;
            const hasInventoryRows = variant.inventories.length > 0;
            const totalAvailableFromInventories = variant.inventories.reduce(
                (sum, inventory) => sum + inventory.availableQuantity,
                0,
            );

            const availableStock = hasInventoryRows ? totalAvailableFromInventories : variant.stock;

            if (availableStock < quantity) {
                throw new BadRequestException(
                    `Insufficient stock for SKU ${variant.sku}. Requested ${quantity}, available ${availableStock}`,
                );
            }

            const unitPriceValue =
                buyerType === BuyerType.SHOP_OWNER ? variant.wholesaleGross : variant.retailGross;

            const unitPrice = new Prisma.Decimal(unitPriceValue);
            const lineSubtotal = unitPrice.mul(quantity);
            const taxRate = new Prisma.Decimal(variant.taxRate ?? 0);
            const taxAmount = lineSubtotal.mul(taxRate).div(100);
            const lineTotal = lineSubtotal.add(taxAmount);

            subtotal = subtotal.add(lineSubtotal);
            totalTax = totalTax.add(taxAmount);

            const variantLabel = [variant.size, variant.color].filter(Boolean).join(' ').trim() || null;

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

            if (hasInventoryRows) {
                let remainingQty = quantity;

                for (const inventory of variant.inventories) {
                    if (remainingQty <= 0) {
                        break;
                    }

                    if (inventory.availableQuantity <= 0) {
                        continue;
                    }

                    const deductQty = Math.min(inventory.availableQuantity, remainingQty);

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
                    throw new BadRequestException(`Could not allocate inventory for SKU ${variant.sku}`);
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

        const shipping = new Prisma.Decimal(shippingAmount);
        const discount = new Prisma.Decimal(discountAmount);
        const totalAmount = subtotal.add(totalTax).add(shipping).sub(discount);

        // Load address snapshots so later profile changes never affect old orders.
        let billingSnapshot: {
            billingFullName: string | null;
            billingPhone: string | null;
            billingAddressLine1: string;
            billingAddressLine2: string | null;
            billingLandmark: string | null;
            billingCity: string;
            billingDistrict: string | null;
            billingState: string | null;
            billingCountry: string | null;
            billingPostalCode: string | null;
        } | null = null;

        let shippingSnapshot: {
            shippingFullName: string | null;
            shippingPhone: string | null;
            shippingAddressLine1: string;
            shippingAddressLine2: string | null;
            shippingLandmark: string | null;
            shippingCity: string;
            shippingDistrict: string | null;
            shippingState: string | null;
            shippingCountry: string | null;
            shippingPostalCode: string | null;
        } | null = null;

        if (customerId && billingAddressId) {
            const billing = await this.prisma.customerAddress.findFirst({
                where: {
                    id: billingAddressId,
                    customerId,
                    isActive: true,
                },
            });

            if (!billing) {
                throw new BadRequestException('Billing address not found for this customer');
            }

            billingSnapshot = {
                billingFullName: billing.fullName ?? null,
                billingPhone: billing.phone ?? null,
                billingAddressLine1: billing.addressLine1,
                billingAddressLine2: billing.addressLine2 ?? null,
                billingLandmark: billing.landmark ?? null,
                billingCity: billing.city,
                billingDistrict: billing.district ?? null,
                billingState: billing.state ?? null,
                billingCountry: billing.country ?? null,
                billingPostalCode: billing.postalCode ?? null,
            };
        }

        if (customerId && shippingAddressId) {
            const shippingAddress = await this.prisma.customerAddress.findFirst({
                where: {
                    id: shippingAddressId,
                    customerId,
                    isActive: true,
                },
            });

            if (!shippingAddress) {
                throw new BadRequestException('Shipping address not found for this customer');
            }

            shippingSnapshot = {
                shippingFullName: shippingAddress.fullName ?? null,
                shippingPhone: shippingAddress.phone ?? null,
                shippingAddressLine1: shippingAddress.addressLine1,
                shippingAddressLine2: shippingAddress.addressLine2 ?? null,
                shippingLandmark: shippingAddress.landmark ?? null,
                shippingCity: shippingAddress.city,
                shippingDistrict: shippingAddress.district ?? null,
                shippingState: shippingAddress.state ?? null,
                shippingCountry: shippingAddress.country ?? null,
                shippingPostalCode: shippingAddress.postalCode ?? null,
            };
        }

        if (buyerType === BuyerType.CUSTOMER && (!billingSnapshot || !shippingSnapshot)) {
            throw new BadRequestException(
                'Billing and shipping addresses are required for CUSTOMER order',
            );
        }

        const orderNumber = `ORD-${Date.now()}`;

        const createdOrder = await this.prisma.$transaction(async (tx) => {
            const orderCreateData: Prisma.OrderCreateInput = {
                orderNumber,
                brandOwner: {
                    connect: { id: brandOwnerId },
                },
                buyerType,
                salesChannel: salesChannel ?? SalesChannelType.MANUAL,
                buyerName,
                buyerEmail,
                buyerPhone,
                currencyCode: 'INR',
                subtotalAmount: subtotal,
                discountAmount: discount,
                taxAmount: totalTax,
                shippingAmount: shipping,
                totalAmount,
                status: OrderStatus.PENDING,
                paymentStatus: PaymentStatus.UNPAID,
                notes,
                billingAddressLine1: billingSnapshot?.billingAddressLine1 ?? '',
                billingCity: billingSnapshot?.billingCity ?? '',
                billingFullName: billingSnapshot?.billingFullName ?? null,
                billingPhone: billingSnapshot?.billingPhone ?? null,
                billingAddressLine2: billingSnapshot?.billingAddressLine2 ?? null,
                billingLandmark: billingSnapshot?.billingLandmark ?? null,
                billingDistrict: billingSnapshot?.billingDistrict ?? null,
                billingState: billingSnapshot?.billingState ?? null,
                billingCountry: billingSnapshot?.billingCountry ?? null,
                billingPostalCode: billingSnapshot?.billingPostalCode ?? null,
                shippingAddressLine1: shippingSnapshot?.shippingAddressLine1 ?? '',
                shippingCity: shippingSnapshot?.shippingCity ?? '',
                shippingFullName: shippingSnapshot?.shippingFullName ?? null,
                shippingPhone: shippingSnapshot?.shippingPhone ?? null,
                shippingAddressLine2: shippingSnapshot?.shippingAddressLine2 ?? null,
                shippingLandmark: shippingSnapshot?.shippingLandmark ?? null,
                shippingDistrict: shippingSnapshot?.shippingDistrict ?? null,
                shippingState: shippingSnapshot?.shippingState ?? null,
                shippingCountry: shippingSnapshot?.shippingCountry ?? null,
                shippingPostalCode: shippingSnapshot?.shippingPostalCode ?? null,
                items: {
                    create: orderItemsData,
                },
            };

            if (customerId) {
                orderCreateData.customer = {
                    connect: { id: customerId },
                };
            }

            if (shopOwnerId) {
                orderCreateData.shopOwner = {
                    connect: { id: shopOwnerId },
                };
            }

            const order = await tx.order.create({
                data: orderCreateData,
                include: {
                    items: true,
                },
            });

            // Deduct stock and write inventory audit rows in the same transaction.
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
                                availableQuantity: deduction.currentAvailable - deduction.deductQty,
                            },
                        });

                        await tx.inventoryTransaction.create({
                            data: {
                                brandOwnerId,
                                productVariantId: plan.productVariantId,
                                locationId: deduction.locationId,
                                transactionType: InventoryTransactionType.ORDER_CONFIRMED,
                                quantityChange: -deduction.deductQty,
                                balanceAfter: deduction.currentAvailable - deduction.deductQty,
                                referenceType: 'ORDER',
                                referenceId: order.id,
                                note: `Stock deducted for order ${order.orderNumber}`,
                            },
                        });
                    }
                } else {
                    await tx.inventoryTransaction.create({
                        data: {
                            brandOwnerId,
                            productVariantId: plan.productVariantId,
                            transactionType: InventoryTransactionType.ORDER_CONFIRMED,
                            quantityChange: -plan.quantity,
                            balanceAfter: newVariantStock,
                            referenceType: 'ORDER',
                            referenceId: order.id,
                            note: `Stock deducted for order ${order.orderNumber}`,
                        },
                    });
                }
            }

            return order;
        });

        return {
            message: 'Order created successfully',
            order: createdOrder,
        };
    }

    async findAll(query: OrderQueryDto, user: JwtUser) {
        const actor = await this.getActorScope(user);

        const {
            search,
            status,
            paymentStatus,
            buyerType,
            salesChannel,
            fromDate,
            toDate,
            page = '1',
            limit = '10',
        } = query;

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);
        const skip = (pageNumber - 1) * limitNumber;

        const baseWhere: Prisma.OrderWhereInput = {};

        if (status) {
            baseWhere.status = status;
        }

        if (paymentStatus) {
            baseWhere.paymentStatus = paymentStatus;
        }

        if (buyerType) {
            baseWhere.buyerType = buyerType;
        }

        if (salesChannel) {
            baseWhere.salesChannel = salesChannel;
        }

        if (search?.trim()) {
            const searchValue = search.trim();

            baseWhere.OR = [
                {
                    orderNumber: {
                        contains: searchValue,
                        mode: 'insensitive',
                    },
                },
                {
                    buyerName: {
                        contains: searchValue,
                        mode: 'insensitive',
                    },
                },
                {
                    buyerPhone: {
                        contains: searchValue,
                        mode: 'insensitive',
                    },
                },
                {
                    buyerEmail: {
                        contains: searchValue,
                        mode: 'insensitive',
                    },
                },
            ];
        }

        if (fromDate || toDate) {
            baseWhere.createdAt = {};

            if (fromDate) {
                const parsedFromDate = new Date(fromDate);

                if (Number.isNaN(parsedFromDate.getTime())) {
                    throw new BadRequestException('Invalid fromDate');
                }

                baseWhere.createdAt.gte = parsedFromDate;
            }

            if (toDate) {
                const parsedToDate = new Date(toDate);

                if (Number.isNaN(parsedToDate.getTime())) {
                    throw new BadRequestException('Invalid toDate');
                }

                parsedToDate.setHours(23, 59, 59, 999);
                baseWhere.createdAt.lte = parsedToDate;
            }
        }

        const where = this.applyOrderScope(baseWhere, actor);

        // Fetch list in a lighter shape that is better for admin tables and cards.
        const [orders, total] = await this.prisma.$transaction([
            this.prisma.order.findMany({
                where,
                skip,
                take: limitNumber,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    brandOwner: {
                        select: {
                            id: true,
                            businessName: true,
                        },
                    },
                    customer: {
                        select: {
                            id: true,
                            customerCode: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                        },
                    },
                    shopOwner: {
                        select: {
                            id: true,
                            shopName: true,
                            ownerName: true,
                            phone: true,
                        },
                    },
                    items: {
                        select: {
                            id: true,
                            productName: true,
                            variantLabel: true,
                            quantity: true,
                            lineTotal: true,
                        },
                    },
                    payments: {
                        select: {
                            amountPaid: true,
                        },
                    },
                },
            }),
            this.prisma.order.count({ where }),
        ]);

        const data = orders.map((order) => {
            const totalPaid = order.payments.reduce(
                (sum, payment) => sum.add(new Prisma.Decimal(payment.amountPaid)),
                new Prisma.Decimal(0),
            );

            const pendingAmount = new Prisma.Decimal(order.totalAmount).sub(totalPaid);

            return {
                id: order.id,
                orderNumber: order.orderNumber,
                createdAt: order.createdAt,
                buyerType: order.buyerType,
                salesChannel: order.salesChannel,
                buyerName: order.buyerName,
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
                itemSummary: order.items.map((item) => ({
                    id: item.id,
                    productName: item.productName,
                    variantLabel: item.variantLabel,
                    quantity: item.quantity,
                    lineTotal: item.lineTotal,
                })),
                brandOwner: order.brandOwner,
                customer: order.customer
                    ? {
                        id: order.customer.id,
                        customerCode: order.customer.customerCode,
                        name: `${order.customer.firstName} ${order.customer.lastName ?? ''}`.trim(),
                        phone: order.customer.phone,
                    }
                    : null,
                shopOwner: order.shopOwner
                    ? {
                        id: order.shopOwner.id,
                        shopName: order.shopOwner.shopName,
                        ownerName: order.shopOwner.ownerName,
                        phone: order.shopOwner.phone,
                    }
                    : null,
            };
        });

        return {
            message: 'Orders fetched successfully',
            data,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            },
        };
    }

    async findOne(id: string, user: JwtUser) {
        const actor = await this.getActorScope(user);

        const where = this.applyOrderScope({ id }, actor);

        const order = await this.prisma.order.findFirst({
            where,
            include: {
                brandOwner: {
                    select: {
                        id: true,
                        businessName: true,
                        phone: true,
                        gstNumber: true,
                        address: true,
                        city: true,
                        state: true,
                        country: true,
                        logoUrl: true,
                    },
                },
                customer: {
                    select: {
                        id: true,
                        customerCode: true,
                        type: true,
                        status: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        alternatePhone: true,
                    },
                },
                shopOwner: {
                    select: {
                        id: true,
                        shopName: true,
                        ownerName: true,
                        email: true,
                        phone: true,
                        address: true,
                        shopSlug: true,
                    },
                },
                items: {
                    orderBy: {
                        createdAt: 'asc',
                    },
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
                },
                payments: {
                    orderBy: {
                        paymentDate: 'desc',
                    },
                },
                sellerOrders: {
                    include: {
                        brandOwner: {
                            select: {
                                id: true,
                                businessName: true,
                            },
                        },
                        items: {
                            select: {
                                id: true,
                                productName: true,
                                productCode: true,
                                variantSku: true,
                                variantLabel: true,
                                quantity: true,
                                unitPrice: true,
                                taxAmount: true,
                                lineSubtotal: true,
                                lineTotal: true,
                            },
                        },
                    },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return {
            message: 'Order fetched successfully',
            data: order,
        };
    }

    async updateNotes(id: string, dto: UpdateOrderNotesDto, user: JwtUser) {
        const actor = await this.getActorScope(user);

        const existingOrder = await this.prisma.order.findFirst({
            where: this.applyOrderScope({ id }, actor),
            select: {
                id: true,
            },
        });

        if (!existingOrder) {
            throw new NotFoundException('Order not found');
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: {
                notes: dto.notes,
            },
            select: {
                id: true,
                orderNumber: true,
                notes: true,
                updatedAt: true,
            },
        });

        return {
            message: 'Order notes updated successfully',
            data: updatedOrder,
        };
    }
}