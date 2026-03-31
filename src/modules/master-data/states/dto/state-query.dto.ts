import {
    IsBooleanString,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class StateQueryDto {
    @IsOptional()
    @IsString()
    @MaxLength(120)
    search?: string;

    @IsOptional()
    @IsUUID()
    countryId?: string;

    @IsOptional()
    @IsBooleanString()
    isActive?: string;
}