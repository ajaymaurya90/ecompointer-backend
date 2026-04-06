import { IsArray, IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderCategoryItemDto {
    @ApiProperty({ description: 'Category ID', example: 'uuid-here' })
    @IsUUID()
    id: string;

    @ApiProperty({ description: 'Parent category ID (null if root)', example: null })
    @IsOptional()
    @IsUUID()
    parentId?: string | null;

    @ApiProperty({ description: 'Order index', example: 0 })
    @IsInt()
    @Min(0)
    order: number;
}

export class ReorderCategoriesDto {
    @ApiProperty({ type: [ReorderCategoryItemDto] })
    @IsArray()
    items: ReorderCategoryItemDto[];
}