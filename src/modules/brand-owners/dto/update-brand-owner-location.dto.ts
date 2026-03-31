import {
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class UpdateBrandOwnerLocationDto {
    @IsOptional()
    @IsUUID()
    countryId?: string;

    @IsOptional()
    @IsUUID()
    stateId?: string;

    @IsOptional()
    @IsUUID()
    districtId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    city?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    address?: string;
}