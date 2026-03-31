import {
    IsBoolean,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { AddressType } from '@prisma/client';

export class CreateCustomerAddressDto {
    @IsOptional()
    @IsEnum(AddressType)
    type?: AddressType;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    fullName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string;

    @IsString()
    @MaxLength(255)
    addressLine1!: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    addressLine2?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    landmark?: string;

    @IsString()
    @MaxLength(120)
    city!: string;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    district?: string;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    state?: string;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    country?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    postalCode?: string;

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
    @IsBoolean()
    isDefault?: boolean;
}