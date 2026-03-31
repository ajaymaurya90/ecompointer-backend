import {
    IsBoolean,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { BusinessType } from '@prisma/client';

export class CreateCustomerBusinessDto {
    @IsString()
    @MaxLength(150)
    businessName!: string;

    @IsOptional()
    @IsString()
    @MaxLength(150)
    legalBusinessName?: string;

    @IsOptional()
    @IsEnum(BusinessType)
    businessType?: BusinessType;

    @IsOptional()
    @IsUUID()
    shopOwnerId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    contactPersonName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    contactPersonPhone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    contactPersonEmail?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    gstNumber?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    taxId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(80)
    registrationNumber?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    website?: string;

    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}