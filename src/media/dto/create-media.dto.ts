import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    IsEnum,
    IsUUID,
} from 'class-validator';
import { MediaType } from '@prisma/client';

export class CreateMediaDto {
    @IsOptional()
    @IsUUID()
    productId?: string;

    @IsOptional()
    @IsUUID()
    variantId?: string;

    @IsString()
    url: string;

    @IsOptional()
    @IsString()
    altText?: string;

    @IsOptional()
    @IsEnum(MediaType)
    type?: MediaType;

    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}
