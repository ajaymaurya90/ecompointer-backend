import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StorefrontOrdersService } from '../services/storefront-orders.service';
import { CreateStorefrontOrderDto } from '../dto/create-storefront-order.dto';
import { StorefrontCustomerGuard } from '../../auth/guards/storefront-customer.guard';
import { CurrentStorefrontCustomer } from '../../auth/decorators/current-storefront-customer.decorator';
import type { StorefrontCustomerJwt } from '../../auth/interfaces/storefront-customer-jwt.interface';

@ApiTags('Storefront Orders')
@Controller('storefront/orders')
export class StorefrontOrdersController {
    constructor(
        private readonly storefrontOrdersService: StorefrontOrdersService,
    ) { }

    /* =====================================================
       CREATE STOREFRONT ORDER
       ===================================================== */
    @Post('brand-owner/:brandOwnerId')
    create(
        @Param('brandOwnerId', new ParseUUIDPipe()) brandOwnerId: string,
        @Body() dto: CreateStorefrontOrderDto,
    ) {
        return this.storefrontOrdersService.create(brandOwnerId, dto);
    }

    /* =====================================================
       GET CURRENT CUSTOMER ORDER LIST
       ===================================================== */
    @UseGuards(StorefrontCustomerGuard)
    @Get('my')
    findMyOrders(
        @CurrentStorefrontCustomer() customer: StorefrontCustomerJwt,
    ) {
        return this.storefrontOrdersService.findMyOrders(customer);
    }

    /* =====================================================
       GET CURRENT CUSTOMER ORDER DETAIL
       ===================================================== */
    @UseGuards(StorefrontCustomerGuard)
    @Get('my/:orderId')
    findMyOrder(
        @Param('orderId', new ParseUUIDPipe()) orderId: string,
        @CurrentStorefrontCustomer() customer: StorefrontCustomerJwt,
    ) {
        return this.storefrontOrdersService.findMyOrder(orderId, customer);
    }
}