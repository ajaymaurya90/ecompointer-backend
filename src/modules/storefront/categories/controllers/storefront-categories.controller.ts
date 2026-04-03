import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StorefrontCategoriesService } from '../services/storefront-categories.service';

@ApiTags('Storefront Categories')
@Controller('storefront/categories')
export class StorefrontCategoriesController {
    constructor(
        private readonly storefrontCategoriesService: StorefrontCategoriesService,
    ) { }

    /* =====================================================
       GET STOREFRONT CATEGORY LIST BY BRAND OWNER
       ===================================================== */
    @Get('brand-owner/:brandOwnerId')
    findAll(
        @Param('brandOwnerId', new ParseUUIDPipe()) brandOwnerId: string,
    ) {
        return this.storefrontCategoriesService.findAll(brandOwnerId);
    }

    /* =====================================================
       GET STOREFRONT CATEGORY DETAIL
       ===================================================== */
    @Get('brand-owner/:brandOwnerId/:categoryId')
    findOne(
        @Param('brandOwnerId', new ParseUUIDPipe()) brandOwnerId: string,
        @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
    ) {
        return this.storefrontCategoriesService.findOne(
            brandOwnerId,
            categoryId,
        );
    }
}