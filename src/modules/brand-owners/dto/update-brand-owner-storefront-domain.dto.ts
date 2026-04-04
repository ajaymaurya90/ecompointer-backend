import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * ---------------------------------------------------------
 * UPDATE BRAND OWNER STOREFRONT DOMAIN DTO
 * ---------------------------------------------------------
 * Purpose:
 * Validates payload for updating an existing storefront domain
 * owned by the logged-in Brand Owner.
 * ---------------------------------------------------------
 */
export class UpdateBrandOwnerStorefrontDomainDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    hostName?: string;

    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsBoolean()
    isVerified?: boolean;
}