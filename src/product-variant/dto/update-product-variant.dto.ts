import { IsOptional, IsNumber, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ---------------------------------------------------------
 * UPDATE PRODUCT VARIANT DTO
 * ---------------------------------------------------------
 * Used for partially updating a product variant.
 *
 * Features:
 * - Update financial fields (net prices, tax rate)
 * - Update cost price
 * - Update stock quantity
 *
 * Notes:
 * - All fields are optional (PATCH request)
 * - Gross prices are automatically recalculated in service
 * - All numeric values must be >= 0
 * ---------------------------------------------------------
 */

export class UpdateProductVariantDto {
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
}
