import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ---------------------------------------------------------
 * UPDATE PRODUCT DTO
 * ---------------------------------------------------------
 * Used for partially updating a product.
 *
 * All fields are optional because this DTO
 * is used with PATCH requests.
 * ---------------------------------------------------------
 */

export class UpdateProductDto {
    @ApiPropertyOptional({
        example: 'Premium Cotton T-Shirt',
        description: 'Updated product name',
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        example: 'Updated description for the product.',
        description: 'Updated product description',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        example: '660e8400-e29b-41d4-a716-446655440111',
        description: 'New category UUID (if product is being moved)',
    })
    @IsOptional()
    @IsUUID()
    categoryId?: string;
}
