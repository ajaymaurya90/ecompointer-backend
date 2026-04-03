import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StorefrontProductsService } from '../services/storefront-products.service';
import { StorefrontProductQueryDto } from '../dto/storefront-product-query.dto';

@ApiTags('Storefront Products')
@Controller('storefront/products')
export class StorefrontProductsController {
    constructor(
        private readonly storefrontProductsService: StorefrontProductsService,
    ) { }

    /* =====================================================
       GET STOREFRONT PRODUCT LIST BY BRAND OWNER
       ===================================================== */
    @Get('brand-owner/:brandOwnerId')
    findAll(
        @Param('brandOwnerId', new ParseUUIDPipe()) brandOwnerId: string,
        @Query() query: StorefrontProductQueryDto,
    ) {
        return this.storefrontProductsService.findAll(brandOwnerId, query);
    }

    /* =====================================================
       GET STOREFRONT PRODUCT DETAIL
       ===================================================== */
    @Get('brand-owner/:brandOwnerId/:productId')
    findOne(
        @Param('brandOwnerId', new ParseUUIDPipe()) brandOwnerId: string,
        @Param('productId', new ParseUUIDPipe()) productId: string,
    ) {
        return this.storefrontProductsService.findOne(brandOwnerId, productId);
    }
}