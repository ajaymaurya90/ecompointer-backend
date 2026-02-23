import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ---------------------------------------------------------
 * UPDATE PRODUCT CATEGORY DTO
 * ---------------------------------------------------------
 * Used for partially updating a product category.
 *
 * Currently supports:
 * - Updating category name
 *
 * All fields are optional because this DTO
 * is used with PATCH requests.
 * ---------------------------------------------------------
 */

export class UpdateProductCategoryDto {
    @ApiPropertyOptional({
        example: 'Updated Category Name',
        description: 'New name for the product category',
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        example: 'Updated Sub Category Name',
        description: 'New name for the product Sub category',
    })
    @IsOptional()
    @IsString()
    parentId?: any;
}
