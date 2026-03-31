import {
    IsDateString,
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import { CustomerSource, CustomerStatus, CustomerType } from '@prisma/client';

export class CreateCustomerDto {
    @IsOptional()
    @IsEnum(CustomerType)
    type?: CustomerType;

    @IsOptional()
    @IsEnum(CustomerStatus)
    status?: CustomerStatus;

    @IsOptional()
    @IsEnum(CustomerSource)
    source?: CustomerSource;

    @IsString()
    @MaxLength(100)
    firstName!: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    lastName?: string;

    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    alternatePhone?: string;

    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}