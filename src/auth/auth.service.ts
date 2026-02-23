import { Injectable, UnauthorizedException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, Role } from '@prisma/client';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(data: RegisterDto) {
        // Check if email already exists
        const existingEmail = await this.prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingEmail) {
            throw new ConflictException('Email already exists');
        }

        // Check if phone already exists
        const existingPhone = await this.prisma.user.findUnique({
            where: { phone: data.phone },
        });

        if (existingPhone) {
            throw new ConflictException('Phone number already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        return this.prisma.$transaction(async (tx) => {

            // Create User (Human Identity)
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    role: Role.BRAND_OWNER,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                },
            });

            // Create BrandOwner (Business Entity)
            await tx.brandOwner.create({
                data: {
                    businessName: data.businessName,
                    userId: user.id,
                },
            });

            return {
                message: 'Registered successfully',
                userId: user.id,
            };
        });
    }

    async login(data: LoginDto) {
        // Find user by email and Reject if user not found
        const user = await this.prisma.user.findUnique({
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
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken: hashedRefresh,
            },
        });

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }

    async getUserProfile(userId: string): Promise<ProfileResponseDto> {

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                brandOwner: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Base user info
        const baseProfile: ProfileResponseDto = {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            createdAt: user.createdAt,
            business: null,
        };

        // If BRAND_OWNER → attach business
        if (user.role === 'BRAND_OWNER' && user.brandOwner) {
            baseProfile.business = {
                id: user.brandOwner.id,
                businessName: user.brandOwner.businessName,
            };
        }

        // SUPER_ADMIN → business remains null

        return baseProfile;
    }

    // Allow users to update their own profile, and admins to update any profile
    async updateUserProfile(
        currentUserId: string,
        currentUserRole: string,
        targetUserId: string,
        dto: UpdateProfileDto
    ) {

        // If not SUPER_ADMIN → can only update self
        if (currentUserRole !== 'SUPER_ADMIN' && currentUserId !== targetUserId) {
            throw new ForbiddenException('You can only update your own profile');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            include: { brandOwner: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Update user table
        await this.prisma.user.update({
            where: { id: targetUserId },
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
            },
        });

        // If user is BRAND_OWNER and businessName provided
        if (user.role === 'BRAND_OWNER' && dto.businessName) {
            await this.prisma.brandOwner.update({
                where: { userId: targetUserId },
                data: {
                    businessName: dto.businessName,
                },
            });
        }

        return { message: 'Profile updated successfully' };
    }

    // Admin can view all non-admin users with pagination
    async getAllUsers(page: number, limit: number) {

        const skip = (page - 1) * limit;

        const [users, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                where: {
                    role: { not: 'SUPER_ADMIN' },
                },
                include: { brandOwner: true },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({
                where: {
                    role: { not: 'SUPER_ADMIN' },
                },
            }),
        ]);

        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // Soft delete user by setting isDeleted flag and deletedAt timestamp
    async softDeleteUser(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });

        return { message: 'User deleted successfully' };
    }

    // Helper method to generate access and refresh tokens
    private async generateTokens(user: User) {
        // Create JWT payload (includes version for rotation security)
        const payload = {
            sub: user.id,
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

        const user = await this.prisma.user.findUnique({
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

        const hashedRefresh = await bcrypt.hash(newRefreshToken, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: hashedRefresh },
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
            const user = await this.prisma.user.findUnique({
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
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    tokenVersion: { increment: 1 },
                },
            });

            // Reload updated user (required to get new version)
            const updatedUser = await this.prisma.user.findUnique({
                where: { id: user.id },
            });

            if (!updatedUser) {
                throw new UnauthorizedException();
            }

            // Generate fresh tokens using updated version
            const tokens = await this.generateTokens(updatedUser);

            // Hash and store new refresh token
            const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);

            await this.prisma.user.update({
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
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });

        return { message: 'Logged out successfully' };
    }

}

