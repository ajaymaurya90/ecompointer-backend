import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtGuard } from './jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtUser } from './types/jwt-user.type';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    // Register a new brand owner account
    @Post('register')
    register(@Body() data: RegisterDto) {
        return this.authService.register(data);
    }

    // Authenticate user and return access + refresh tokens
    @Post('login')
    login(@Body() data: LoginDto) {
        return this.authService.login(data);
    }

    // Protected route to fetch authenticated user profile
    @UseGuards(JwtGuard)
    @Get('profile')
    getProfile(@Req() req: any) {
        return req.user;
    }

    // Exchange valid refresh token for new access + refresh tokens
    @Post('refresh')
    async refresh(@Body('refreshToken') refreshToken: string) {
        return this.authService.refreshToken(refreshToken);
    }

    // Logout user by invalidating stored refresh token
    @UseGuards(AuthGuard('jwt'))
    @Post('logout')
    async logout(@CurrentUser() user: JwtUser) {
        return this.authService.logout(user.id);
    }

}

