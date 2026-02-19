/**
 * ProductCategoryController
 * -----------------------------------------------------
 * Primary Responsibilities:
 * 1. Exposes REST endpoints for product category operations
 * 2. Handles request validation at controller level (basic checks)
 * 3. Delegates business logic to ProductCategoryService
 * 4. Ensures required query parameters are provided
 *
 * Routes:
 * POST   /categories        → Create new category
 * GET    /categories        → Get categories by brand (root + children)
 */

import {
    Controller,
    Post,
    Body,
    Get,
    Query,
    BadRequestException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiQuery,
} from '@nestjs/swagger';
import { ProductCategoryService } from './product-category.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';

@ApiTags('Product Categories')
@Controller('categories')
export class ProductCategoryController {
    constructor(private readonly service: ProductCategoryService) { }

    /**
     * Create a new product category
     *
     * Expected body:
     * - name: string
     * - brandId: string
     * - parentId?: string (optional for sub-category)
     *
     * Validation of brand and parent category
     * is handled inside the service layer.
     */
    @ApiOperation({ summary: 'Create a new product category' })
    @ApiResponse({
        status: 201,
        description: 'Category created successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid input data',
    })
    @Post()
    create(@Body() dto: CreateProductCategoryDto) {
        return this.service.create(dto);
    }

    /**
     * Get categories by brand
     *
     * Query Params:
     * - brandId (required)
     *
     * Returns:
     * - Root categories (parentId = null)
     * - Includes active child categories
     * - Ordered by creation date
     */
    @ApiOperation({
        summary: 'Get categories by brand',
    })
    @ApiQuery({
        name: 'brandId',
        required: true,
        description: 'Brand UUID to filter categories',
        example: '660e8400-e29b-41d4-a716-446655440000',
    })
    @ApiResponse({
        status: 200,
        description: 'List of categories for the brand',
    })
    @ApiResponse({
        status: 400,
        description: 'brandId is required',
    })
    @Get()
    findByBrand(@Query('brandId') brandId: string) {
        // Basic guard check at controller level
        if (!brandId) {
            throw new BadRequestException('brandId is required');
        }

        return this.service.findByBrand(brandId);
    }
}
