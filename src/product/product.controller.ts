import { Controller, Post, Body, Req, Get, Param, ParseUUIDPipe, Query, Patch, Delete } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductController {
    constructor(private readonly service: ProductService) { }

    /*@Post()
    create(@Body() dto: CreateProductDto, @Req() req) {
        return this.service.create(dto, req.user.id);
    }*/

    @Post()
    create(@Body() dto: CreateProductDto) {
        // Temporary: bypass owner validation
        return this.service.create(dto);
    }

    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.findOne(id);
    }

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

    @Patch(':id')
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateProductDto,
    ) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.remove(id);
    }



}
