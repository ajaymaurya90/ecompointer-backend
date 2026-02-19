import { IsString, IsOptional } from 'class-validator';

export class UpdateProductCategoryDto {
    @IsOptional()
    @IsString()
    name?: string;
}
