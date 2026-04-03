import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { BrandStatus } from '@prisma/client';

export class CreateBrandDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    tagline?: string;

    @IsString()
    @IsOptional()
    logoUrl?: string;

    @IsEnum(BrandStatus)
    @IsOptional()
    status?: BrandStatus;
}