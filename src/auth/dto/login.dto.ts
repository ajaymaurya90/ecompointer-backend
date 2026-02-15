import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @IsEmail()
    @ApiProperty({ example: 'test@example.com' })
    email: string;

    @IsString()
    @ApiProperty({ example: 'password123' })
    password: string;
}
