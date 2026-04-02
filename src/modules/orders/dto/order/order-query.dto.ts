import { BuyerType, OrderStatus, PaymentStatus, SalesChannelType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class OrderQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsOptional()
    @IsEnum(PaymentStatus)
    paymentStatus?: PaymentStatus;

    @IsOptional()
    @IsEnum(BuyerType)
    buyerType?: BuyerType;

    @IsOptional()
    @IsEnum(SalesChannelType)
    salesChannel?: SalesChannelType;

    @IsOptional()
    @IsString()
    fromDate?: string;

    @IsOptional()
    @IsString()
    toDate?: string;

    @IsOptional()
    @IsString()
    page?: string;

    @IsOptional()
    @IsString()
    limit?: string;
}