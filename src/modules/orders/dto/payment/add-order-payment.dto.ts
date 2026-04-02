import { PaymentMethod } from '@prisma/client';
import {
    IsDateString,
    IsEnum,
    IsNumberString,
    IsOptional,
    IsString,
} from 'class-validator';

export class AddOrderPaymentDto {
    @IsNumberString()
    amountPaid: string;

    @IsDateString()
    paymentDate: string;

    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;

    @IsOptional()
    @IsString()
    referenceNo?: string;

    @IsOptional()
    @IsString()
    note?: string;
}