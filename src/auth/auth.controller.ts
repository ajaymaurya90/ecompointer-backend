import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
    Res,
    Get,
    UnauthorizedException,
    Patch,
    Param,
    Query,
    Delete
} from '@nestjs/common';

import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
    ApiParam
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtGuard } from './jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtUser } from './types/jwt-user.type';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('Authentication') // Group all endpoints under "Authentication"
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    // ==============================
    // REGISTER
    // ==============================

    @ApiOperation({ summary: 'Register a new Brand Owner account' })
    @ApiResponse({ status: 201, description: 'User registered successfully' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    @Post('register')
    register(@Body() data: RegisterDto) {
        return this.authService.register(data);
    }

    // ==============================
    // LOGIN
    // ==============================

    @ApiOperation({ summary: 'Login user and receive access token' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    @Post('login')
    async login(
        @Body() data: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.login(data);

        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: false, // set true in production with HTTPS
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return {
            accessToken: result.accessToken,
            user: result.user
        };
    }

    // ==============================
    // GET PROFILE
    // ==============================

    @ApiBearerAuth() // Enables "Authorize" button in Swagger
    @ApiOperation({ summary: 'Get logged-in user profile' })
    @ApiResponse({ status: 200, description: 'User profile fetched successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @UseGuards(JwtGuard)
    @Get('profile')
    getProfile(@CurrentUser() user: any) {
        return this.authService.getUserProfile(user.id);
    }

    // ==============================
    // UPDATE OWN PROFILE
    // ==============================

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update logged-in user profile' })
    @ApiResponse({ status: 200, description: 'Profile updated successfully' })
    @UseGuards(JwtGuard)
    @Patch('profile')
    updateOwnProfile(
        @CurrentUser() user: any,
        @Body() dto: UpdateProfileDto
    ) {
        return this.authService.updateUserProfile(
            user.id,
            user.role,
            user.id,
            dto
        );
    }

    // ==============================
    // ADMIN UPDATE ANY USER
    // ==============================

    @ApiBearerAuth()
    @ApiOperation({ summary: 'SUPER_ADMIN can update any user profile' })
    @ApiParam({ name: 'id', description: 'Target user ID' })
    @ApiResponse({ status: 200, description: 'User updated successfully' })
    @UseGuards(JwtGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    @Patch('admin/user/:id')
    updateUserByAdmin(
        @CurrentUser() user: any,
        @Param('id') targetUserId: string,
        @Body() dto: UpdateProfileDto
    ) {
        return this.authService.updateUserProfile(
            user.id,
            user.role,
            targetUserId,
            dto
        );
    }

    // ==============================
    // ADMIN GET ALL USERS (Paginated)
    // ==============================

    @ApiBearerAuth()
    @ApiOperation({ summary: 'SUPER_ADMIN can view all non-admin users (paginated)' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    @UseGuards(JwtGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    @Get('admin/users')
    getAllUsers(
        @Query('page') page = 1,
        @Query('limit') limit = 10,
    ) {
        return this.authService.getAllUsers(
            Number(page),
            Number(limit),
        );
    }

    // ==============================
    // ADMIN SOFT DELETE USER
    // ==============================

    @ApiBearerAuth()
    @ApiOperation({ summary: 'SUPER_ADMIN can soft delete a user' })
    @ApiParam({ name: 'id', description: 'User ID to delete' })
    @ApiResponse({ status: 200, description: 'User soft deleted successfully' })
    @UseGuards(JwtGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    @Delete('admin/user/:id')
    deleteUser(@Param('id') id: string) {
        return this.authService.softDeleteUser(id);
    }

    // ==============================
    // REFRESH TOKEN
    // ==============================

    @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
    @ApiResponse({ status: 401, description: 'No refresh token found' })
    @Post('refresh')
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response
    ) {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            throw new UnauthorizedException("No refresh token found");
        }

        const tokens = await this.authService.refresh(refreshToken);

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return {
            accessToken: tokens.accessToken,
            user: tokens.user,
        };
    }

    // ==============================
    // LOGOUT
    // ==============================

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout user and invalidate refresh token' })
    @ApiResponse({ status: 200, description: 'Logged out successfully' })
    @UseGuards(AuthGuard('jwt'))
    @Post('logout')
    async logout(
        @CurrentUser() user: JwtUser,
        @Res({ passthrough: true }) res: Response,
    ) {
        await this.authService.logout(user.id);

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
        });

        return { message: 'Logged out successfully' };
    }
}