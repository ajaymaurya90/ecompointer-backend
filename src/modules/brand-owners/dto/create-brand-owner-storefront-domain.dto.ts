import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * ---------------------------------------------------------
 * CREATE BRAND OWNER STOREFRONT DOMAIN DTO
 * ---------------------------------------------------------
 * Purpose:
 * Validates payload for creating a new storefront domain
 * owned by the logged-in Brand Owner.
 * ---------------------------------------------------------
 */
export class CreateBrandOwnerStorefrontDomainDto {
    @IsString()
    @MaxLength(255)
    hostName!: string;

    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}