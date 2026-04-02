import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, Prisma, Role } from '@prisma/client';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
import { PrismaService } from '../../../prisma/prisma.service';
import { AddOrderPaymentDto } from '../dto/payment/add-order-payment.dto';

type ActorScope = {
    role: Role;
    brandOwnerId?: string;
    shopOwnerId?: string;
};

@Injectable()
export class OrderPaymentsService {
    constructor(private readonly prisma: PrismaService) { }

    // Resolve current actor scope from authenticated user.
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

        throw new ForbiddenException('You are not allowed to access order payments');
    }

    // Return only the order accessible to the current role.
    private async getScopedOrder(orderId: string, user: JwtUser) {
        const actor = await this.getActorScope(user);

        const where =
            actor.role === Role.BRAND_OWNER
                ? { id: orderId, brandOwnerId: actor.brandOwnerId }
                : actor.role === Role.SHOP_OWNER
                    ? { id: orderId, shopOwnerId: actor.shopOwnerId }
                    : { id: orderId };

        const order = await this.prisma.order.findFirst({
            where,
            include: {
                payments: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    async addPayment(orderId: string, dto: AddOrderPaymentDto, user: JwtUser) {
        const { amountPaid, paymentDate, paymentMethod, referenceNo, note } = dto;

        const order = await this.getScopedOrder(orderId, user);
        const paymentAmount = new Prisma.Decimal(amountPaid);

        if (paymentAmount.lte(0)) {
            throw new BadRequestException('Payment amount must be greater than 0');
        }

        const orderTotal = new Prisma.Decimal(order.totalAmount);

        const alreadyPaid = order.payments.reduce(
            (sum, payment) => sum.add(new Prisma.Decimal(payment.amountPaid)),
            new Prisma.Decimal(0),
        );

        const newTotalPaid = alreadyPaid.add(paymentAmount);

        if (newTotalPaid.gt(orderTotal)) {
            throw new BadRequestException('Payment amount exceeds pending balance');
        }

        const parsedPaymentDate = new Date(paymentDate);

        if (Number.isNaN(parsedPaymentDate.getTime())) {
            throw new BadRequestException('Invalid paymentDate');
        }

        const result = await this.prisma.$transaction(async (tx) => {
            const payment = await tx.orderPayment.create({
                data: {
                    order: {
                        connect: { id: orderId },
                    },
                    amountPaid: paymentAmount,
                    paymentDate: parsedPaymentDate,
                    paymentMethod,
                    referenceNo,
                    note,
                },
            });

            let paymentStatus: PaymentStatus = PaymentStatus.UNPAID;

            if (newTotalPaid.eq(orderTotal)) {
                paymentStatus = PaymentStatus.PAID;
            } else if (newTotalPaid.gt(0)) {
                paymentStatus = PaymentStatus.PARTIALLY_PAID;
            }

            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus,
                },
                select: {
                    id: true,
                    orderNumber: true,
                    totalAmount: true,
                    paymentStatus: true,
                },
            });

            return {
                payment,
                order: updatedOrder,
                totalPaid: newTotalPaid,
                pendingAmount: orderTotal.sub(newTotalPaid),
            };
        });

        return {
            message: 'Payment added successfully',
            data: result,
        };
    }

    async findPayments(orderId: string, user: JwtUser) {
        const order = await this.getScopedOrder(orderId, user);

        const payments = await this.prisma.orderPayment.findMany({
            where: { orderId },
            orderBy: {
                paymentDate: 'desc',
            },
        });

        const totalPaid = payments.reduce(
            (sum, payment) => sum.add(new Prisma.Decimal(payment.amountPaid)),
            new Prisma.Decimal(0),
        );

        const pendingAmount = new Prisma.Decimal(order.totalAmount).sub(totalPaid);

        return {
            message: 'Payments fetched successfully',
            data: {
                order: {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    totalAmount: order.totalAmount,
                    paymentStatus: order.paymentStatus,
                },
                payments,
                summary: {
                    totalPaid,
                    pendingAmount,
                },
            },
        };
    }
}