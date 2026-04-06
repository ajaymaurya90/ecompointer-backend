import { Transform } from 'class-transformer';
import {
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ---------------------------------------------------------
 * STOREFRONT PRODUCT QUERY DTO
 * ---------------------------------------------------------
 * Purpose:
 * Validates storefront product list query parameters.
 *
 * Supports:
 * - search
 * - pagination
 * - category filter
 * ---------------------------------------------------------
 */
export class StorefrontProductQueryDto {
    @ApiPropertyOptional({
        example: 't-shirt',
        description: 'Search by product name or product code',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        example: 1,
        description: 'Page number',
    })
    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        example: 12,
        description: 'Items per page',
    })
    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    limit?: number = 12;

    @ApiPropertyOptional({
        example: '660e8400-e29b-41d4-a716-446655440000',
        description: 'Optional category id for storefront filtering',
    })
    @IsOptional()
    @IsUUID()
    categoryId?: string;
}