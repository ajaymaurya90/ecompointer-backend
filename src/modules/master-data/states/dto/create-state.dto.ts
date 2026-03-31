import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class CreateStateDto {
    @IsUUID()
    countryId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    code?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}