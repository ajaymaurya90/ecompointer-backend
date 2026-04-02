import {
    IsEmail,
    IsOptional,
    IsString,
    IsUrl,
    MinLength,
} from 'class-validator';

export class UpdateShopOwnerDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    shopName?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    ownerName?: string;

    @IsOptional()
    @IsString()
    @MinLength(5)
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    postalCode?: string;

    @IsOptional()
    @IsString()
    @MinLength(3)
    shopSlug?: string;

    @IsOptional()
    @IsUrl()
    qrCodeUrl?: string;

    @IsOptional()
    @IsString()
    language?: string;

    @IsOptional()
    @IsString()
    businessName?: string;

    @IsOptional()
    @IsString()
    legalEntityName?: string;

    @IsOptional()
    @IsString()
    gstNumber?: string;
}