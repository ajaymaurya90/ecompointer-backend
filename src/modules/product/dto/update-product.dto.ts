import {
    IsOptional,
    IsString,
    IsUUID,
    IsArray,
    ArrayNotEmpty,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ---------------------------------------------------------
 * UPDATE PRODUCT DTO
 * ---------------------------------------------------------
 * categoryId = primary/default category
 * categoryIds = full assigned category list
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
        example: 'AYD-COTTON-002',
        description: 'Updated product code',
    })
    @IsOptional()
    @IsString()
    productCode?: string;

    @ApiPropertyOptional({
        example: 'Updated description for the product.',
        description: 'Updated product description',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'New brand UUID',
    })
    @IsOptional()
    @IsUUID()
    brandId?: string;

    @ApiPropertyOptional({
        example: '660e8400-e29b-41d4-a716-446655440112',
        description: 'New primary/default category UUID',
    })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({
        example: [
            '660e8400-e29b-41d4-a716-446655440112',
            '660e8400-e29b-41d4-a716-446655440113',
        ],
        description: 'Full assigned category UUID list including primary category',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('4', { each: true })
    categoryIds?: string[];
}