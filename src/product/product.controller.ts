/**
 * ---------------------------------------------------------
 * PRODUCT CONTROLLER
 * ---------------------------------------------------------
 * Primary Responsibilities:
 *
 * 1. Expose REST API endpoints for product operations
 * 2. Handle request parameter parsing & validation
 * 3. Delegate business logic to ProductService
 * 4. Validate UUID parameters using ParseUUIDPipe
 * 5. Support pagination & optional brand filtering
 *
 * Routes:
 * POST    /products            → Create product
 * GET     /products/:id        → Get single product (with relations)
 * GET     /products            → Paginated product list
 * PATCH   /products/:id        → Update product
 * DELETE  /products/:id        → Soft delete product
 *
 * Notes:
 * - Owner validation temporarily disabled (planned for auth integration)
 * - Controller remains thin (no business logic here)
 * ---------------------------------------------------------
 */
import { Controller, Post, Body, Req, Get, Param, ParseUUIDPipe, Query, Patch, Delete, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtGuard } from 'src/auth/jwt.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtGuard, RolesGuard)
@Controller('products')
@ApiTags('Products')
export class ProductController {
    constructor(private readonly service: ProductService) { }

    /**
   * Create a new product
   *
   * Currently bypassing owner validation.
   * Future implementation will extract user from request
   * and validate brand ownership.
   */
    @ApiOperation({ summary: 'Create a new product' })
    @ApiResponse({ status: 201, description: 'Product created successfully' })
    @Post()
    @Roles(Role.BRAND_OWNER)
    create(@Req() req, @Body() dto: CreateProductDto) {
        // Temporary: bypass owner validation
        return this.service.create(dto, req.user);
    }

    /**
   * Get a single product by ID
   *
   * - Validates UUID format
   * - Returns product with:
   *    - Brand
   *    - Category
   *    - Product-level media
   *    - Variants + variant media
   */

    @ApiOperation({ summary: 'Get product by ID' })
    @ApiParam({ name: 'id', description: 'Product UUID' })
    @Roles(Role.BRAND_OWNER, Role.SHOP_OWNER)
    @Get(':id')
    findOne(
        @Req() req,
        @Param('id', new ParseUUIDPipe()) id: string,
    ) {
        return this.service.findOne(id, req.user);
    }
    /*@Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.findOne(id);
    }*/

    /**
   * Get paginated list of products
   *
   * Query Parameters:
   * - page (optional, default: 1)
   * - limit (optional, default: 10)
   * - brandId (optional filter)
   *
   * Returns paginated response:
   * {
   *   data: Product[],
   *   meta: { total, page, lastPage }
   * }
   */
    @ApiOperation({ summary: 'Get paginated product list' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'brandId', required: false })
    @Roles(Role.BRAND_OWNER, Role.SHOP_OWNER)
    @Get()
    findAll(
        @Req() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('categoryId') categoryId?: string,
        @Query('sortBy') sortBy?: string,
        @Query('order') order?: 'asc' | 'desc',
    ) {
        return this.service.findAll(
            req.user,
            Number(page) || 1,
            Number(limit) || 10,
            { search, categoryId, sortBy, order }
        );
    }
    /*@Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('brandId') brandId?: string,
    ) {
        return this.service.findAll(
            Number(page) || 1,
            Number(limit) || 10,
            brandId,
        );
    }*/

    /**
   * Update product details
   *
   * - Validates UUID
   * - Only allows basic field updates
   * - Business validation handled in service
   */
    @Patch(':id')
    @Roles(Role.BRAND_OWNER)
    update(
        @Req() req,
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateProductDto,
    ) {
        return this.service.update(id, dto, req.user);
    }

    /**
   * Soft delete product
   *
   * - Sets product.isActive = false
   * - Cascades deactivation to variants
   * - No hard delete performed
   */
    @Delete(':id')
    @Roles(Role.BRAND_OWNER)
    remove(
        @Req() req,
        @Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.remove(id, req.user);
    }

}
