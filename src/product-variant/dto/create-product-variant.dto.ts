import {
    IsString,
    IsOptional,
    IsNumber,
    IsInt,
    Min,
} from 'class-validator';

export class CreateProductVariantDto {
    @IsOptional()
    @IsString()
    sku?: string;

    @IsOptional()
    @IsString()
    size?: string;

    @IsOptional()
    @IsString()
    color?: string;

    @IsNumber()
    @Min(0)
    taxRate: number;

    @IsNumber()
    @Min(0)
    costPrice: number;

    @IsNumber()
    @Min(0)
    wholesaleNet: number;

    @IsNumber()
    @Min(0)
    retailNet: number;

    @IsInt()
    @Min(0)
    stock: number;
}
