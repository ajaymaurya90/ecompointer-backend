/**
 * ---------------------------------------------------------
 * PRODUCT VARIANT CONTROLLER
 * ---------------------------------------------------------
 * Primary Responsibilities:
 *
 * 1. Expose REST endpoints for product variant operations
 * 2. Validate UUID route parameters
 * 3. Delegate business logic to ProductVariantService
 * 4. Maintain nested route structure under product
 *
 * Route Structure:
 * Base: /products/:productId/variants
 *
 * POST    /products/:productId/variants
 * GET     /products/:productId/variants
 * GET     /products/:productId/variants/summary
 * PATCH   /products/:productId/variants/:variantId
 * DELETE  /products/:productId/variants/:variantId
 * ---------------------------------------------------------
 */

import {
    Controller,
    Post,
    Body,
    Param,
    ParseUUIDPipe,
    Patch,
    Delete,
    Get,
    UseGuards,
} from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/jwt.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
import { GenerateProductVariantsDto } from './dto/generate-product-variants.dto';

@UseGuards(JwtGuard, RolesGuard)
@Controller('products/:productId/variants')
@ApiTags('Product Variants')
export class ProductVariantController {
    constructor(private readonly service: ProductVariantService) { }

    @ApiOperation({ summary: 'Create variant for a product' })
    @ApiParam({ name: 'productId', description: 'Product UUID' })
    @Roles(Role.BRAND_OWNER)
    @Post()
    create(
        @Param('productId', new ParseUUIDPipe()) productId: string,
        @Body() dto: CreateProductVariantDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.create(productId, dto, user);
    }

    @ApiOperation({ summary: 'List all active variants for a product' })
    @ApiParam({ name: 'productId', description: 'Product UUID' })
    @Roles(Role.BRAND_OWNER, Role.SHOP_OWNER, Role.SUPER_ADMIN)
    @Get()
    findAll(
        @Param('productId', new ParseUUIDPipe()) productId: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.findAll(productId, user);
    }

    @ApiOperation({ summary: 'Get aggregated stock & pricing summary' })
    @ApiParam({ name: 'productId', description: 'Product UUID' })
    @Roles(Role.BRAND_OWNER, Role.SHOP_OWNER, Role.SUPER_ADMIN)
    @Get('summary')
    getSummary(
        @Param('productId', new ParseUUIDPipe()) productId: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.getSummary(productId, user);
    }

    @ApiOperation({ summary: 'Update product variant' })
    @ApiParam({ name: 'productId', description: 'Product UUID' })
    @ApiParam({ name: 'variantId', description: 'Variant UUID' })
    @Roles(Role.BRAND_OWNER)
    @Patch(':variantId')
    update(
        @Param('productId', new ParseUUIDPipe()) productId: string,
        @Param('variantId', new ParseUUIDPipe()) variantId: string,
        @Body() dto: UpdateProductVariantDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.update(productId, variantId, dto, user);
    }

    @ApiOperation({ summary: 'Soft delete product variant' })
    @ApiParam({ name: 'productId', description: 'Product UUID' })
    @ApiParam({ name: 'variantId', description: 'Variant UUID' })
    @Roles(Role.BRAND_OWNER)
    @Delete(':variantId')
    remove(
        @Param('productId', new ParseUUIDPipe()) productId: string,
        @Param('variantId', new ParseUUIDPipe()) variantId: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.remove(productId, variantId, user);
    }

    @ApiOperation({ summary: 'Generate variants from attribute combinations' })
    @ApiParam({ name: 'productId', description: 'Product UUID' })
    @Roles(Role.BRAND_OWNER)
    @Post('generate')
    generate(
        @Param('productId', new ParseUUIDPipe()) productId: string,
        @Body() dto: GenerateProductVariantsDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.generate(productId, dto, user);
    }
}