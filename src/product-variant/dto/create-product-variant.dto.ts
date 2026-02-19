import {
    IsString,
    IsOptional,
    IsNumber,
    IsInt,
    Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ---------------------------------------------------------
 * CREATE PRODUCT VARIANT DTO
 * ---------------------------------------------------------
 * Used to create a variant under a product.
 *
 * Features:
 * - Optional SKU (auto-generated if not provided)
 * - Variant attributes (size, color)
 * - Financial fields (net prices + tax rate)
 * - Stock management
 *
 * Notes:
 * - Gross prices are calculated in the service layer
 * - All monetary values must be >= 0
 * ---------------------------------------------------------
 */

export class CreateProductVariantDto {
    @ApiPropertyOptional({
        example: 'TSHIRT-001-M-BLACK',
        description:
            'Optional SKU. If not provided, it will be auto-generated from productCode + attributes.',
    })
    @IsOptional()
    @IsString()
    sku?: string;

    @ApiPropertyOptional({
        example: 'M',
        description: 'Size attribute of the variant',
    })
    @IsOptional()
    @IsString()
    size?: string;

    @ApiPropertyOptional({
        example: 'Black',
        description: 'Color attribute of the variant',
    })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiProperty({
        example: 19,
        description: 'Tax rate percentage (e.g., 19 for 19%)',
    })
    @IsNumber()
    @Min(0)
    taxRate: number;

    @ApiProperty({
        example: 10.5,
        description: 'Internal cost price (purchase/manufacturing cost)',
    })
    @IsNumber()
    @Min(0)
    costPrice: number;

    @ApiProperty({
        example: 15,
        description: 'Wholesale net price (excluding tax)',
    })
    @IsNumber()
    @Min(0)
    wholesaleNet: number;

    @ApiProperty({
        example: 25,
        description: 'Retail net price (excluding tax)',
    })
    @IsNumber()
    @Min(0)
    retailNet: number;

    @ApiProperty({
        example: 100,
        description: 'Available stock quantity',
    })
    @IsInt()
    @Min(0)
    stock: number;
}
