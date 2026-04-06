import {
    IsString,
    IsUUID,
    IsOptional,
    IsArray,
    ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ---------------------------------------------------------
 * CREATE PRODUCT DTO
 * ---------------------------------------------------------
 * categoryId = primary/default category
 * categoryIds = full assigned category list (optional)
 * ---------------------------------------------------------
 */
export class CreateProductDto {
    @ApiProperty({
        example: 'Classic Cotton T-Shirt',
        description: 'Product display name',
    })
    @IsString()
    name!: string;

    @ApiProperty({
        example: 'TSHIRT-001',
        description: 'Unique product code',
    })
    @IsString()
    productCode!: string;

    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Brand UUID',
    })
    @IsUUID()
    brandId!: string;

    @ApiProperty({
        example: '660e8400-e29b-41d4-a716-446655440111',
        description: 'Primary/default category UUID',
    })
    @IsUUID()
    categoryId!: string;

    @ApiPropertyOptional({
        example: [
            '660e8400-e29b-41d4-a716-446655440111',
            '660e8400-e29b-41d4-a716-446655440222',
        ],
        description: 'All assigned category UUIDs including primary category',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('4', { each: true })
    categoryIds?: string[];

    @ApiPropertyOptional({
        example: 'Premium 100% cotton t-shirt with modern fit.',
        description: 'Optional product description',
    })
    @IsOptional()
    @IsString()
    description?: string;
}