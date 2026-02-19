import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ---------------------------------------------------------
 * CREATE PRODUCT DTO
 * ---------------------------------------------------------
 * Used for creating a new product.
 *
 * Validations:
 * - name: required string
 * - productCode: required string (unique identifier)
 * - brandId: required UUID
 * - categoryId: required UUID
 * - description: optional string
 * ---------------------------------------------------------
 */

export class CreateProductDto {
    @ApiProperty({
        example: 'Classic Cotton T-Shirt',
        description: 'Product display name',
    })
    @IsString()
    name: string;

    @ApiProperty({
        example: 'TSHIRT-001',
        description: 'Unique product code',
    })
    @IsString()
    productCode: string;

    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Brand UUID',
    })
    @IsUUID()
    brandId: string;

    @ApiProperty({
        example: '660e8400-e29b-41d4-a716-446655440111',
        description: 'Category UUID',
    })
    @IsUUID()
    categoryId: string;

    @ApiPropertyOptional({
        example: 'Premium 100% cotton t-shirt with modern fit.',
        description: 'Optional product description',
    })
    @IsOptional()
    @IsString()
    description?: string;
}
