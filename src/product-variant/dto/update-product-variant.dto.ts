import { IsOptional, IsNumber, IsInt, Min } from 'class-validator';

export class UpdateProductVariantDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    taxRate?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    costPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    wholesaleNet?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    retailNet?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    stock?: number;
}
