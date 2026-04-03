import {
    IsEmail,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';

export class StorefrontRegisterDto {
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
    @MinLength(5)
    phone?: string;

    @IsString()
    @MinLength(6)
    password: string;
}