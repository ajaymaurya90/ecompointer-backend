import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class CreateDistrictDto {
    @IsUUID()
    stateId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name!: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}