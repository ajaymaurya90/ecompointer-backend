import { IsString, IsOptional } from 'class-validator';

export class UpdateBrandDto {
    @IsString()
    @IsOptional()
    name?: string;
}
