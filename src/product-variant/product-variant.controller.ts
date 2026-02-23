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
 *         → Create variant for a product
 *
 * PATCH   /products/:productId/variants/:variantId
 *         → Update variant
 *
 * DELETE  /products/:productId/variants/:variantId
 *         → Soft delete variant
 *
 * Notes:
 * - Controller contains no business logic
 * - All validation & financial logic handled in service layer
 * - UUID validation enforced via ParseUUIDPipe
 * ---------------------------------------------------------
 */
import { Controller, Post, Body, Param, ParseUUIDPipe, Patch, Delete, Get, UseGuards, Req } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/jwt.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from '@prisma/client';

@UseGuards(JwtGuard, RolesGuard)
@Controller('products/:productId/variants')
@ApiTags('Product Variants')
export class ProductVariantController {
    constructor(private readonly service: ProductVariantService) { }

    /**
   * Create a new variant under a product
   *
   * - Validates productId as UUID
   * - Delegates SKU generation & validation to service
   */
    @ApiOperation({ summary: 'Create variant for a product' })
    @ApiParam({ name: 'productId', description: 'Product UUID' })
    @Roles(Role.BRAND_OWNER)
    @Post()
    create(
        @Param('productId', new ParseUUIDPipe()) productId: string,
        @Body() dto: CreateProductVariantDto,
    ) {
        return this.service.create(productId, dto);
    }



    /**
   * Update variant details
   *
   * - Validates variantId as UUID
   * - Recalculates financial fields in service layer
   */
    @ApiOperation({ summary: 'Update product variant' })
    @ApiParam({ name: 'variantId', description: 'Variant UUID' })
    @Roles(Role.BRAND_OWNER)
    @Patch(':variantId')
    update(
        @Param('variantId', new ParseUUIDPipe()) variantId: string,
        @Body() dto: UpdateProductVariantDto,
    ) {
        return this.service.update(variantId, dto);
    }

    /**
   * Soft delete variant
   *
   * - Sets isActive = false
   * - Preserves historical data
   */
    @ApiOperation({ summary: 'Delete product variant' })
    @ApiParam({ name: 'variantId', description: 'Variant UUID' })
    @Roles(Role.BRAND_OWNER)
    @Delete(':variantId')
    remove(@Param('variantId', new ParseUUIDPipe()) variantId: string) {
        return this.service.remove(variantId);
    }

    /**
 * List all active variants for a product
 */
    @Roles(Role.BRAND_OWNER, Role.SHOP_OWNER, Role.SUPER_ADMIN)
    @Get()
    findAll(
        @Param('productId', new ParseUUIDPipe()) productId: string,
        @Req() req,
    ) {
        return this.service.findAll(productId, req.user);
    }

    /**
 * Get aggregated stock & pricing summary
 */
    @Roles(Role.BRAND_OWNER, Role.SHOP_OWNER, Role.SUPER_ADMIN)
    @Get('summary')
    getSummary(
        @Param('productId', new ParseUUIDPipe()) productId: string,
        @Req() req,
    ) {
        return this.service.getSummary(productId, req.user);
    }

}


