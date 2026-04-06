import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ---------------------------------------------------------
 * CREATE PRODUCT CATEGORY DTO
 * ---------------------------------------------------------
 * Used to create a product category.
 *
 * Features:
 * - Category name
 * - Brand association
 * - Optional parent category (for nested categories)
 * ---------------------------------------------------------
 */

export class CreateProductCategoryDto {
    @ApiProperty({
        example: 'Men T-Shirts',
        description: 'Name of the product category',
    })
    @IsString()
    name: string;

    /*@ApiProperty({
        example: '660e8400-e29b-41d4-a716-446655440000',
        description: 'UUID of the brand this category belongs to',
    })
    @IsUUID()
    brandOwnerId: string; */

    @ApiPropertyOptional({
        example: '660e8400-e29b-41d4-a716-446655440111',
        description:
            'Optional parent category UUID (used for creating sub-categories)',
    })
    @IsOptional()
    @IsUUID()
    parentId?: string;

    @IsOptional()
    @IsString()
    description?: string;

}
