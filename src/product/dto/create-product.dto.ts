import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateProductDto {
    @IsString()
    name: string;

    @IsString()
    productCode: string;

    @IsUUID()
    brandId: string;

    @IsUUID()
    categoryId: string;

    @IsOptional()
    @IsString()
    description?: string;
}
