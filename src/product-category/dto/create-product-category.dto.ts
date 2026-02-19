import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateProductCategoryDto {
    @IsString()
    name: string;

    @IsUUID()
    brandId: string;

    @IsOptional()
    @IsUUID()
    parentId?: string;
}
