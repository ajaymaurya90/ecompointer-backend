import { Controller, Post, Body, Get, Query, BadRequestException } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';

@Controller('categories')
export class ProductCategoryController {
    constructor(private readonly service: ProductCategoryService) { }

    @Post()
    create(@Body() dto: CreateProductCategoryDto) {
        return this.service.create(dto);
    }

    @Get()
    findByBrand(@Query('brandId') brandId: string) {
        if (!brandId) {
            throw new BadRequestException('brandId is required');
        }

        return this.service.findByBrand(brandId);
    }

}
