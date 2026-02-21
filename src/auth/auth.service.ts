import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { BrandOwner } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(data: RegisterDto) {
        // Check if email already exists
        const existing = await this.prisma.brandOwner.findUnique({
            where: { email: data.email },
        });

        // Prevent duplicate registrations
        if (existing) {
            throw new ConflictException('Email already exists');
        }

        // Hash password before storing in database
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create new brand owner record
        const user = await this.prisma.brandOwner.create({
            data: {
                email: data.email,
                password: hashedPassword,
                brandName: data.brandName,
            },
        });

        return { message: 'Registered successfully', userId: user.id };
    }



    async login(data: LoginDto) {
        // Find user by email and Reject if user not found
        const user = await this.prisma.brandOwner.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Validate password and Reject if password incorrect
        const isValid = await bcrypt.compare(data.password, user.password);

        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate access & refresh tokens
        const tokens = await this.generateTokens(user);

        // Hash refresh token before storing in DB
        const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);

        // Store hashed refresh token
        await this.prisma.brandOwner.update({
            where: { id: user.id },
            data: {
                refreshToken: hashedRefresh,
            },
        });

        return tokens;
    }


    private async generateTokens(user: BrandOwner) {
        // Create JWT payload (includes version for rotation security)
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            version: user.tokenVersion,
        };

        // Generate short-lived access token
        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '15m',
        });

        // Generate long-lived refresh token
        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d',
        });

        return { accessToken, refreshToken };
    }

    async refresh(refreshToken: string) {
        const payload = this.jwtService.verify(refreshToken, {
            secret: process.env.JWT_REFRESH_SECRET,
        });

        const user = await this.prisma.brandOwner.findUnique({
            where: { id: payload.sub },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (!user.refreshToken) {
            throw new ForbiddenException('Access denied');
        }
        const isMatch = await bcrypt.compare(
            refreshToken,
            user.refreshToken
        );

        if (!isMatch) {
            throw new UnauthorizedException('refresh token mismatch');
        }

        const newAccessToken = this.jwtService.sign(
            {
                sub: user.id,
                email: user.email,
                role: user.role,
            },
            {
                secret: process.env.JWT_ACCESS_SECRET,
                expiresIn: "15m",
            },
        );

        const newRefreshToken = this.jwtService.sign(
            { sub: user.id },
            {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: "7d",
            },
        );

        await this.prisma.brandOwner.update({
            where: { id: user.id },
            data: { refreshToken: newRefreshToken },
        });

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }

    // Note: Method is not used in controller since we read refresh token from cookie, but kept for completeness
    async refreshToken(token: string) {
        try {
            // Verify refresh token signature & expiration
            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_REFRESH_SECRET,
            });

            // Fetch user from database
            const user = await this.prisma.brandOwner.findUnique({
                where: { id: payload.sub },
            });

            // Reject if user not found or no stored refresh token
            if (!user || !user.refreshToken) {
                throw new UnauthorizedException();
            }

            // Critical: Ensure token version matches (prevents replay attacks)
            if (payload.version !== user.tokenVersion) {
                throw new UnauthorizedException();
            }

            // Validate refresh token against stored hash
            const isValid = await bcrypt.compare(token, user.refreshToken);
            if (!isValid) {
                throw new UnauthorizedException();
            }

            // Increment tokenVersion to invalidate old tokens
            await this.prisma.brandOwner.update({
                where: { id: user.id },
                data: {
                    tokenVersion: { increment: 1 },
                },
            });

            // Reload updated user (required to get new version)
            const updatedUser = await this.prisma.brandOwner.findUnique({
                where: { id: user.id },
            });

            if (!updatedUser) {
                throw new UnauthorizedException();
            }

            // Generate fresh tokens using updated version
            const tokens = await this.generateTokens(updatedUser);

            // Hash and store new refresh token
            const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);

            await this.prisma.brandOwner.update({
                where: { id: user.id },
                data: {
                    refreshToken: hashedRefresh,
                },
            });

            return tokens;
        } catch (error) {
            // Any verification failure results in unauthorized response
            throw new UnauthorizedException();
        }
    }

    async logout(userId: string) {
        // Remove stored refresh token to fully invalidate session
        await this.prisma.brandOwner.update({
            where: { id: userId },
            data: { refreshToken: null },
        });

        return { message: 'Logged out successfully' };
    }

}

