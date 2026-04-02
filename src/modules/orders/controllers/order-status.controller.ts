import {
    Body,
    Controller,
    Param,
    ParseUUIDPipe,
    Patch,
    UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
import { CancelOrderDto } from '../dto/status/cancel-order.dto';
import { UpdateOrderStatusDto } from '../dto/status/update-order-status.dto';
import { OrderStatusService } from '../services/order-status.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('orders')
export class OrderStatusController {
    constructor(private readonly orderStatusService: OrderStatusService) { }

    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN)
    @Patch(':id/status')
    updateStatus(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateOrderStatusDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.orderStatusService.updateStatus(id, dto, user);
    }

    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN)
    @Patch(':id/cancel')
    cancel(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: CancelOrderDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.orderStatusService.cancel(id, dto, user);
    }
}