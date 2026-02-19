import { Controller, Post, Body, Param, ParseUUIDPipe, Patch, Delete } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Controller('products/:productId/variants')
export class ProductVariantController {
    constructor(private readonly service: ProductVariantService) { }

    @Post()
    create(
        @Param('productId', new ParseUUIDPipe()) productId: string,
        @Body() dto: CreateProductVariantDto,
    ) {
        return this.service.create(productId, dto);
    }

    @Patch(':variantId')
    update(
        @Param('variantId', new ParseUUIDPipe()) variantId: string,
        @Body() dto: UpdateProductVariantDto,
    ) {
        return this.service.update(variantId, dto);
    }

    @Delete(':variantId')
    remove(@Param('variantId', new ParseUUIDPipe()) variantId: string) {
        return this.service.remove(variantId);
    }

}


