import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    IsEnum,
    IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';

/**
 * ---------------------------------------------------------
 * CREATE MEDIA DTO
 * ---------------------------------------------------------
 * Used to attach media to:
 * - A Product
 * - OR a Product Variant
 *
 * Business Rules:
 * - Must belong to product OR variant (not both)
 * - Only one primary image per parent
 * - Primary auto-assigned if none exists
 * ---------------------------------------------------------
 */

export class CreateMediaDto {
    @ApiPropertyOptional({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description:
            'Product UUID. Required if variantId is not provided.',
    })
    @IsOptional()
    @IsUUID()
    productId?: string;

    @ApiPropertyOptional({
        example: '660e8400-e29b-41d4-a716-446655440111',
        description:
            'Variant UUID. Required if productId is not provided.',
    })
    @IsOptional()
    @IsUUID()
    variantId?: string;

    @ApiProperty({
        example: 'https://cdn.example.com/images/product-1.jpg',
        description: 'Public URL of the media file',
    })
    @IsString()
    url: string;

    @ApiPropertyOptional({
        example: 'Front view of the black t-shirt',
        description: 'Alternative text for accessibility / SEO',
    })
    @IsOptional()
    @IsString()
    altText?: string;

    @ApiPropertyOptional({
        enum: MediaType,
        example: MediaType.GALLERY,
        description: 'Type of media (e.g., IMAGE, VIDEO)',
    })
    @IsOptional()
    @IsEnum(MediaType)
    type?: MediaType;

    @ApiPropertyOptional({
        example: true,
        description:
            'Marks this media as primary. If true, other primary media will be reset.',
    })
    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;

    @ApiPropertyOptional({
        example: 1,
        description:
            'Sorting order (lower number appears first)',
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}
