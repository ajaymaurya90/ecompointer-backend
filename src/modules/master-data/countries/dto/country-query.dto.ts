import { IsBooleanString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CountryQueryDto {
    @IsOptional()
    @IsString()
    @MaxLength(120)
    search?: string;

    @IsOptional()
    @IsBooleanString()
    isActive?: string;
}