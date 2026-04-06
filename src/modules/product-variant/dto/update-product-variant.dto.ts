import {
    IsOptional,
    IsNumber,
    IsInt,
    Min,
    IsString,
    IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ---------------------------------------------------------
 * UPDATE PRODUCT VARIANT DTO
 * ---------------------------------------------------------
 * Used for partially updating a product variant.
 *
 * Features:
 * - Update SKU
 * - Update variant attributes (size, color)
 * - Update financial fields (net prices, tax rate)
 * - Update cost price
 * - Update stock quantity
 * - Update active status
 *
 * Notes:
 * - All fields are optional (PATCH request)
 * - Gross prices are automatically recalculated in service
 * - All numeric values must be >= 0
 * ---------------------------------------------------------
 */
export class UpdateProductVariantDto {
    @ApiPropertyOptional({
        example: 'TSHIRT-001-L-BLACK',
        description: 'Updated SKU for the variant',
    })
    @IsOptional()
    @IsString()
    sku?: string;

    @ApiPropertyOptional({
        example: 'L',
        description: 'Updated size attribute',
    })
    @IsOptional()
    @IsString()
    size?: string;

    @ApiPropertyOptional({
        example: 'Blue',
        description: 'Updated color attribute',
    })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional({
        example: 19,
        description: 'Updated tax rate percentage (e.g., 19 for 19%)',
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    taxRate?: number;

    @ApiPropertyOptional({
        example: 11,
        description: 'Updated internal cost price',
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    costPrice?: number;

    @ApiPropertyOptional({
        example: 17,
        description: 'Updated wholesale net price (excluding tax)',
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    wholesaleNet?: number;

    @ApiPropertyOptional({
        example: 28,
        description: 'Updated retail net price (excluding tax)',
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    retailNet?: number;

    @ApiPropertyOptional({
        example: 150,
        description: 'Updated available stock quantity',
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    stock?: number;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether the variant is active',
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}