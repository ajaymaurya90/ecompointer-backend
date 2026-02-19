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
import { Controller, Post, Body, Req, Get, Param, ParseUUIDPipe, Query, Patch, Delete } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@Controller('products')
@ApiTags('Products')
@Controller('products')
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
    create(@Body() dto: CreateProductDto) {
        // Temporary: bypass owner validation
        return this.service.create(dto);
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
    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.findOne(id);
    }

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
    @Get()
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
    }

    /**
   * Update product details
   *
   * - Validates UUID
   * - Only allows basic field updates
   * - Business validation handled in service
   */
    @Patch(':id')
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateProductDto,
    ) {
        return this.service.update(id, dto);
    }

    /**
   * Soft delete product
   *
   * - Sets product.isActive = false
   * - Cascades deactivation to variants
   * - No hard delete performed
   */
    @Delete(':id')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.remove(id);
    }

}
