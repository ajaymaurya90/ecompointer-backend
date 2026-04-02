import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InventoryTransactionType, OrderStatus, Role } from '@prisma/client';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
import { PrismaService } from '../../../prisma/prisma.service';
import { CancelOrderDto } from '../dto/status/cancel-order.dto';
import { UpdateOrderStatusDto } from '../dto/status/update-order-status.dto';

type ActorScope = {
    role: Role;
    brandOwnerId?: string;
};

@Injectable()
export class OrderStatusService {
    constructor(private readonly prisma: PrismaService) { }

    // Resolve status-management scope from the current authenticated user.
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

        throw new ForbiddenException('You are not allowed to manage order status');
    }

    // Scope order lookup by role so users cannot touch foreign orders.
    private async getScopedOrder(id: string, user: JwtUser) {
        const actor = await this.getActorScope(user);

        const where =
            actor.role === Role.BRAND_OWNER
                ? { id, brandOwnerId: actor.brandOwnerId }
                : { id };

        const order = await this.prisma.order.findFirst({
            where,
            include: {
                items: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    async updateStatus(id: string, dto: UpdateOrderStatusDto, user: JwtUser) {
        const existingOrder = await this.getScopedOrder(id, user);

        if (existingOrder.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Cancelled order status cannot be changed');
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: {
                status: dto.status,
                notes: dto.note
                    ? existingOrder.notes
                        ? `${existingOrder.notes}\nStatus update note: ${dto.note}`
                        : `Status update note: ${dto.note}`
                    : existingOrder.notes,
            },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                paymentStatus: true,
                updatedAt: true,
            },
        });

        return {
            message: 'Order status updated successfully',
            data: updatedOrder,
        };
    }

    async cancel(id: string, dto: CancelOrderDto, user: JwtUser) {
        const order = await this.getScopedOrder(id, user);

        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Order is already cancelled');
        }

        const updatedOrder = await this.prisma.$transaction(async (tx) => {
            // Restore stock for each order item when an order is cancelled.
            for (const item of order.items) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.productVariantId },
                    include: {
                        inventories: {
                            orderBy: {
                                createdAt: 'asc',
                            },
                        },
                    },
                });

                if (!variant) {
                    throw new NotFoundException(`Variant not found for item ${item.id}`);
                }

                await tx.productVariant.update({
                    where: { id: variant.id },
                    data: {
                        stock: variant.stock + item.quantity,
                    },
                });

                if (variant.inventories.length > 0) {
                    const firstInventory = variant.inventories[0];

                    await tx.productInventory.update({
                        where: { id: firstInventory.id },
                        data: {
                            quantity: firstInventory.quantity + item.quantity,
                            availableQuantity: firstInventory.availableQuantity + item.quantity,
                        },
                    });

                    await tx.inventoryTransaction.create({
                        data: {
                            brandOwnerId: item.brandOwnerId,
                            productVariantId: item.productVariantId,
                            locationId: firstInventory.locationId,
                            transactionType: InventoryTransactionType.ORDER_CANCELLED,
                            quantityChange: item.quantity,
                            balanceAfter: firstInventory.availableQuantity + item.quantity,
                            referenceType: 'ORDER',
                            referenceId: order.id,
                            note: dto.reason
                                ? `Stock restored for cancelled order ${order.orderNumber}. Reason: ${dto.reason}`
                                : `Stock restored for cancelled order ${order.orderNumber}`,
                        },
                    });
                } else {
                    await tx.inventoryTransaction.create({
                        data: {
                            brandOwnerId: item.brandOwnerId,
                            productVariantId: item.productVariantId,
                            transactionType: InventoryTransactionType.ORDER_CANCELLED,
                            quantityChange: item.quantity,
                            balanceAfter: variant.stock + item.quantity,
                            referenceType: 'ORDER',
                            referenceId: order.id,
                            note: dto.reason
                                ? `Stock restored for cancelled order ${order.orderNumber}. Reason: ${dto.reason}`
                                : `Stock restored for cancelled order ${order.orderNumber}`,
                        },
                    });
                }
            }

            return tx.order.update({
                where: { id },
                data: {
                    status: OrderStatus.CANCELLED,
                    notes: dto.reason
                        ? order.notes
                            ? `${order.notes}\nCancellation reason: ${dto.reason}`
                            : `Cancellation reason: ${dto.reason}`
                        : order.notes,
                },
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    paymentStatus: true,
                    updatedAt: true,
                },
            });
        });

        return {
            message: 'Order cancelled successfully',
            data: updatedOrder,
        };
    }
}