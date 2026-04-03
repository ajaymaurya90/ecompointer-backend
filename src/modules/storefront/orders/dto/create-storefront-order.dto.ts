import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEmail,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';

/**
 * ---------------------------------------------------------
 * STOREFRONT ORDER ITEM DTO
 * ---------------------------------------------------------
 * Purpose:
 * Represents one product variant line item requested during
 * storefront checkout.
 * ---------------------------------------------------------
 */
export class CreateStorefrontOrderItemDto {
    @IsUUID()
    productVariantId: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity: number;
}

/**
 * ---------------------------------------------------------
 * STOREFRONT ORDER ADDRESS DTO
 * ---------------------------------------------------------
 * Purpose:
 * Captures billing or shipping address snapshot entered by
 * customer during storefront checkout.
 * ---------------------------------------------------------
 */
export class CreateStorefrontOrderAddressDto {
    @IsOptional()
    @IsString()
    fullName?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsString()
    @MinLength(3)
    addressLine1: string;

    @IsOptional()
    @IsString()
    addressLine2?: string;

    @IsOptional()
    @IsString()
    landmark?: string;

    @IsString()
    @MinLength(2)
    city: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    postalCode?: string;
}

/**
 * ---------------------------------------------------------
 * CREATE STOREFRONT ORDER DTO
 * ---------------------------------------------------------
 * Purpose:
 * Captures the complete checkout payload submitted from
 * storefront cart/checkout flow.
 * ---------------------------------------------------------
 */
export class CreateStorefrontOrderDto {
    @IsString()
    @MinLength(2)
    firstName: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    shippingAmount?: string = '0';

    @IsOptional()
    @IsString()
    discountAmount?: string = '0';

    @IsOptional()
    @IsBoolean()
    sameAsBilling?: boolean = false;

    @ValidateNested()
    @Type(() => CreateStorefrontOrderAddressDto)
    billingAddress: CreateStorefrontOrderAddressDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateStorefrontOrderAddressDto)
    shippingAddress?: CreateStorefrontOrderAddressDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateStorefrontOrderItemDto)
    @IsNotEmpty()
    items: CreateStorefrontOrderItemDto[];
}