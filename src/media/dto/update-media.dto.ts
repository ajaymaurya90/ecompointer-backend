import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ---------------------------------------------------------
 * UPDATE MEDIA DTO
 * ---------------------------------------------------------
 * Used for partially updating media entries.
 *
 * Business Rules (handled in service layer):
 * - Cannot disable the only primary media
 * - If setting new primary → other media will reset
 * - If no primary remains → system auto-assigns one
 * - isActive controls soft activation/deactivation
 *
 * All fields are optional (PATCH request).
 * ---------------------------------------------------------
 */

export class UpdateMediaDto {
    @ApiPropertyOptional({
        example: 'https://cdn.example.com/images/product-new.jpg',
        description: 'Updated public URL of the media file',
    })
    @IsOptional()
    @IsString()
    url?: string;

    @ApiPropertyOptional({
        example: 'Updated alt text for accessibility',
        description: 'Updated alternative text (SEO / accessibility)',
    })
    @IsOptional()
    @IsString()
    altText?: string;

    @ApiPropertyOptional({
        example: true,
        description:
            'Set this media as primary. Other primary media will automatically reset.',
    })
    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;

    @ApiPropertyOptional({
        example: false,
        description:
            'Soft deactivate media. Cannot deactivate the only primary media.',
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        example: 2,
        description: 'Updated sorting order (lower number appears first)',
    })
    @IsOptional()
    @IsInt()
    sortOrder?: number;
}
