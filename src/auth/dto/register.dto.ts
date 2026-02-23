import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @IsEmail()
    @ApiProperty({ example: 'test@example.com' })
    email: string;

    @IsString()
    @MinLength(6)
    @ApiProperty({ example: 'password123' })
    password: string;

    @IsString()
    @ApiProperty({ example: 'Ajay' })
    firstName: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ example: 'Maurya' })
    lastName?: string;

    @IsString()
    phone: string;

    @IsString()
    @ApiProperty({ example: 'ABCD Store' })
    businessName: string;
}
