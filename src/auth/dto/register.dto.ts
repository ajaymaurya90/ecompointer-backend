import { IsEmail, IsString, MinLength } from 'class-validator';
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
    @ApiProperty({ example: 'ABCD Store' })
    brandName: string;
}
