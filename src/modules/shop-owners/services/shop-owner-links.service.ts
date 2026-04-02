import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
import { PrismaService } from '../../../prisma/prisma.service';
import { LinkExistingShopOwnerDto } from '../dto/link-existing-shop-owner.dto';

@Injectable()
export class ShopOwnerLinksService {
    constructor(private readonly prisma: PrismaService) { }

    private async getBrandOwnerId(user: JwtUser) {
        if (user.role !== Role.BRAND_OWNER && user.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenException('You are not allowed to link shop owners');
        }

        if (user.role === Role.SUPER_ADMIN) {
            throw new BadRequestException(
                'Super admin linking flow is not implemented here without explicit brand owner context',
            );
        }

        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { userId: user.id },
            select: { id: true },
        });

        if (!brandOwner) {
            throw new ForbiddenException('Brand owner profile not found for current user');
        }

        return brandOwner.id;
    }

    async linkExisting(dto: LinkExistingShopOwnerDto, user: JwtUser) {
        const brandOwnerId = await this.getBrandOwnerId(user);

        const identifiers = [dto.shopOwnerId, dto.phone, dto.email, dto.shopSlug].filter(Boolean);

        if (identifiers.length === 0) {
            throw new BadRequestException(
                'Provide at least one identifier: shopOwnerId, phone, email, or shopSlug',
            );
        }

        const shopOwner = await this.prisma.shopOwner.findFirst({
            where: {
                OR: [
                    ...(dto.shopOwnerId ? [{ id: dto.shopOwnerId }] : []),
                    ...(dto.phone ? [{ phone: dto.phone.trim() }] : []),
                    ...(dto.email ? [{ email: dto.email.trim().toLowerCase() }] : []),
                    ...(dto.shopSlug ? [{ shopSlug: dto.shopSlug.trim().toLowerCase() }] : []),
                ],
            },
            select: {
                id: true,
                shopName: true,
                ownerName: true,
                phone: true,
                email: true,
            },
        });

        if (!shopOwner) {
            throw new NotFoundException('Shop owner not found');
        }

        const existingLink = await this.prisma.brandOwnerShop.findFirst({
            where: {
                brandOwnerId,
                shopOwnerId: shopOwner.id,
            },
            select: {
                id: true,
                isActive: true,
            },
        });

        if (existingLink) {
            if (existingLink.isActive) {
                throw new BadRequestException('Shop owner is already linked with this brand owner');
            }

            const reactivated = await this.prisma.brandOwnerShop.update({
                where: { id: existingLink.id },
                data: {
                    isActive: true,
                    linkedByUserId: user.id,
                    notes: dto.notes,
                },
            });

            return {
                message: 'Existing shop owner link reactivated successfully',
                data: {
                    shopOwner,
                    link: reactivated,
                },
            };
        }

        const link = await this.prisma.brandOwnerShop.create({
            data: {
                brandOwnerId,
                shopOwnerId: shopOwner.id,
                linkedByUserId: user.id,
                notes: dto.notes,
            },
        });

        return {
            message: 'Existing shop owner linked successfully',
            data: {
                shopOwner,
                link,
            },
        };
    }
}