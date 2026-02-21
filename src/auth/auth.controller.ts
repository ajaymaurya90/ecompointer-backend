import { Controller, Post, Body, UseGuards, Req, Res, Get, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtGuard } from './jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtUser } from './types/jwt-user.type';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    // Register a new brand owner account
    @Post('register')
    register(@Body() data: RegisterDto) {
        return this.authService.register(data);
    }

    // Authenticate user and return access + refresh tokens

    /*@Post('login')
    login(@Body() data: LoginDto) {
        return this.authService.login(data);
    }*/
    @Post('login')
    async login(
        @Body() data: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const tokens = await this.authService.login(data);

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: false,       // VERY IMPORTANT for localhost
            sameSite: 'lax',     // Important for frontend-backend different ports
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
            accessToken: tokens.accessToken,
        };
    }

    // Protected route to fetch authenticated user profile
    @UseGuards(JwtGuard)
    @Get('profile')
    getProfile(@Req() req: any) {
        return req.user;
    }

    // Refresh access token using refresh token cookie
    @Post('refresh')
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response
    ) {

        console.log("Cookies:", req.cookies);
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            console.log("No refresh token found");
            throw new UnauthorizedException();
        }

        const tokens = await this.authService.refresh(refreshToken);

        // Set new refresh token as cookie
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        console.log("response:", tokens.accessToken, tokens.user);

        return {
            accessToken: tokens.accessToken,
            user: tokens.user,
        };
    }

    // Logout user by invalidating stored refresh token
    @UseGuards(AuthGuard('jwt'))
    @Post('logout')
    async logout(
        @CurrentUser() user: JwtUser,
        @Res({ passthrough: true }) res: Response,
    ) {
        await this.authService.logout(user.id);

        // Clear refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
        });

        return { message: 'Logged out successfully' };
    }

}

