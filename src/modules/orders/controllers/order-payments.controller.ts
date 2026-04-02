import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
import { AddOrderPaymentDto } from '../dto/payment/add-order-payment.dto';
import { OrderPaymentsService } from '../services/order-payments.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('orders/:orderId/payments')
export class OrderPaymentsController {
    constructor(private readonly orderPaymentsService: OrderPaymentsService) { }

    @Roles(Role.BRAND_OWNER, Role.SHOP_OWNER, Role.SUPER_ADMIN)
    @Post()
    addPayment(
        @Param('orderId', new ParseUUIDPipe()) orderId: string,
        @Body() dto: AddOrderPaymentDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.orderPaymentsService.addPayment(orderId, dto, user);
    }

    @Roles(Role.BRAND_OWNER, Role.SHOP_OWNER, Role.SUPER_ADMIN)
    @Get()
    findPayments(
        @Param('orderId', new ParseUUIDPipe()) orderId: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.orderPaymentsService.findPayments(orderId, user);
    }
}