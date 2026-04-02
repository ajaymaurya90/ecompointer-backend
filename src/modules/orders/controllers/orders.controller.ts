import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { OrderQueryDto } from '../dto/order/order-query.dto';
import { UpdateOrderNotesDto } from '../dto/order/update-order-notes.dto';
import { OrdersService } from '../services/orders.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Roles(Role.BRAND_OWNER, Role.SHOP_OWNER, Role.SUPER_ADMIN)
    @Post()
    create(
        @Body() dto: CreateOrderDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.ordersService.create(dto, user);
    }

    @Roles(Role.BRAND_OWNER, Role.SHOP_OWNER, Role.SUPER_ADMIN)
    @Get()
    findAll(
        @Query() query: OrderQueryDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.ordersService.findAll(query, user);
    }

    @Roles(Role.BRAND_OWNER, Role.SHOP_OWNER, Role.SUPER_ADMIN)
    @Get(':id')
    findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.ordersService.findOne(id, user);
    }

    @Roles(Role.BRAND_OWNER, Role.SHOP_OWNER, Role.SUPER_ADMIN)
    @Patch(':id/notes')
    updateNotes(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateOrderNotesDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.ordersService.updateNotes(id, dto, user);
    }
}