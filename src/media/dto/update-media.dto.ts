import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateMediaDto {
    @IsOptional()
    @IsString()
    url?: string;

    @IsOptional()
    @IsString()
    altText?: string;

    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsInt()
    sortOrder?: number;
}
