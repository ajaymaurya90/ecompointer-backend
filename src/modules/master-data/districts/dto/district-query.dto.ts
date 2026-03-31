import {
    IsBooleanString,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class DistrictQueryDto {
    @IsOptional()
    @IsString()
    @MaxLength(120)
    search?: string;

    @IsOptional()
    @IsUUID()
    stateId?: string;

    @IsOptional()
    @IsUUID()
    countryId?: string;

    @IsOptional()
    @IsBooleanString()
    isActive?: string;
}