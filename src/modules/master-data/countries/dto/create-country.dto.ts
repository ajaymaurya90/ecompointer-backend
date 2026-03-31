import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateCountryDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    code!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    phoneCode?: string;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    currencyCode?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}