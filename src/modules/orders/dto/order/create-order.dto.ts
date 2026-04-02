import {
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsNumberString,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BuyerType, SalesChannelType } from '@prisma/client';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
    // Buyer decides whether order is placed by a shop owner or a direct customer.
    @IsEnum(BuyerType)
    buyerType: BuyerType;

    // In v1 one order belongs to one brand owner.
    @IsUUID()
    brandOwnerId: string;

    // Required when buyerType is CUSTOMER.
    @IsOptional()
    @IsUUID()
    customerId?: string;

    // Required when buyerType is SHOP_OWNER.
    @IsOptional()
    @IsUUID()
    shopOwnerId?: string;

    @IsOptional()
    @IsEnum(SalesChannelType)
    salesChannel?: SalesChannelType;

    @IsOptional()
    @IsString()
    notes?: string;

    // Frontend may send selected customer address ids and backend will snapshot them into the order.
    @IsOptional()
    @IsUUID()
    billingAddressId?: string;

    @IsOptional()
    @IsUUID()
    shippingAddressId?: string;

    // Optional charges entered from UI; backend must still calculate final totals safely.
    @IsOptional()
    @IsNumberString()
    shippingAmount?: string;

    @IsOptional()
    @IsNumberString()
    discountAmount?: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];
}