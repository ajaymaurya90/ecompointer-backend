import { IsUUID, IsOptional, IsString, IsEnum, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';

export class CreateMediaDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    productId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    variantId?: string;

    @ApiProperty()
    @IsString()
    url: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    altText?: string;

    @ApiPropertyOptional({ enum: MediaType })
    @IsOptional()
    @IsEnum(MediaType)
    type?: MediaType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    mimeType?: string;

    @IsOptional()
    @IsInt()
    size?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    sortOrder?: number;
}