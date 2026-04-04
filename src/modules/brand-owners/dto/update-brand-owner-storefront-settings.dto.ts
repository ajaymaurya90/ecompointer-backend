import {
    IsBoolean,
    IsEmail,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

/**
 * ---------------------------------------------------------
 * UPDATE BRAND OWNER STOREFRONT SETTINGS DTO
 * ---------------------------------------------------------
 * Purpose:
 * Validates merged storefront settings payload coming from
 * Brand Owner admin settings page.
 *
 * Notes:
 * - Payload is flattened for admin simplicity
 * - Service will split values between storefront setting
 *   table and storefront theme table
 * ---------------------------------------------------------
 */
export class UpdateBrandOwnerStorefrontSettingsDto {
    @IsOptional()
    @IsString()
    @MaxLength(120)
    storefrontName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    storefrontLogoUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(180)
    storefrontTagline?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    storefrontShortDescription?: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    storefrontAboutDescription?: string;

    @IsOptional()
    @IsEmail()
    @MaxLength(180)
    storefrontSupportEmail?: string;

    @IsOptional()
    @IsString()
    @MaxLength(40)
    storefrontSupportPhone?: string;

    @IsOptional()
    @IsBoolean()
    isStorefrontEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    isGuestCheckoutEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    isCustomerRegistrationEnabled?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(60)
    activeStorefrontThemeCode?: string;

    @IsOptional()
    @IsBoolean()
    isStorefrontThemeActive?: boolean;
}