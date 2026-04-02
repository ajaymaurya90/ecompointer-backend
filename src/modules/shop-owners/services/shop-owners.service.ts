import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateShopOwnerDto } from '../dto/create-shop-owner.dto';
import { ShopOwnerQueryDto } from '../dto/shop-owner-query.dto';
import { UpdateShopOwnerDto } from '../dto/update-shop-owner.dto';
import { UpdateShopOwnerStatusDto } from '../dto/update-shop-owner-status.dto';

type ActorScope = {
    role: Role;
    brandOwnerId?: string;
    shopOwnerId?: string;
};

@Injectable()
export class ShopOwnersService {
    constructor(private readonly prisma: PrismaService) { }

    private async getActorScope(user: JwtUser): Promise<ActorScope> {
        if (user.role === Role.SUPER_ADMIN) {
            return { role: user.role };
        }

        if (user.role === Role.BRAND_OWNER) {
            const brandOwner = await this.prisma.brandOwner.findUnique({
                where: { userId: user.id },
                select: { id: true },
            });

            if (!brandOwner) {
                throw new ForbiddenException('Brand owner profile not found for current user');
            }

            return { role: user.role, brandOwnerId: brandOwner.id };
        }

        if (user.role === Role.SHOP_OWNER) {
            const shopOwner = await this.prisma.shopOwner.findUnique({
                where: { userId: user.id },
                select: { id: true },
            });

            if (!shopOwner) {
                throw new ForbiddenException('Shop owner profile not found for current user');
            }

            return { role: user.role, shopOwnerId: shopOwner.id };
        }

        throw new ForbiddenException('You are not allowed to access shop owners');
    }

    private async ensureBrandOwner(actor: ActorScope) {
        if (!actor.brandOwnerId) {
            throw new ForbiddenException('Brand owner context is required');
        }

        return actor.brandOwnerId;
    }

    async create(dto: CreateShopOwnerDto, user: JwtUser) {
        const actor = await this.getActorScope(user);

        if (actor.role !== Role.BRAND_OWNER && actor.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenException('You are not allowed to create shop owners');
        }

        const normalizedEmail = dto.email?.trim().toLowerCase() || null;
        const normalizedPhone = dto.phone.trim();
        const normalizedSlug = dto.shopSlug.trim().toLowerCase();

        const existingShopOwner = await this.prisma.shopOwner.findFirst({
            where: {
                OR: [
                    { phone: normalizedPhone },
                    ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
                    { shopSlug: normalizedSlug },
                ],
            },
            select: {
                id: true,
                phone: true,
                email: true,
                shopSlug: true,
            },
        });

        if (existingShopOwner) {
            throw new BadRequestException(
                'A shop owner with the same phone, email, or shop slug already exists',
            );
        }

        const createdShopOwner = await this.prisma.$transaction(async (tx) => {
            const shopOwner = await tx.shopOwner.create({
                data: {
                    shopName: dto.shopName.trim(),
                    ownerName: dto.ownerName.trim(),
                    phone: normalizedPhone,
                    email: normalizedEmail,
                    address: dto.address?.trim(),
                    city: dto.city?.trim(),
                    state: dto.state?.trim(),
                    country: dto.country?.trim(),
                    postalCode: dto.postalCode?.trim(),
                    shopSlug: normalizedSlug,
                    qrCodeUrl: dto.qrCodeUrl?.trim(),
                    language: dto.language?.trim() || 'en',
                    businessName: dto.businessName?.trim(),
                    legalEntityName: dto.legalEntityName?.trim(),
                    gstNumber: dto.gstNumber?.trim(),
                },
            });

            if (actor.role === Role.BRAND_OWNER) {
                await tx.brandOwnerShop.create({
                    data: {
                        brandOwnerId: actor.brandOwnerId!,
                        shopOwnerId: shopOwner.id,
                        linkedByUserId: user.id,
                    },
                });
            }

            return shopOwner;
        });

        return {
            message: 'Shop owner created successfully',
            data: createdShopOwner,
        };
    }

    async findAll(query: ShopOwnerQueryDto, user: JwtUser) {
        const actor = await this.getActorScope(user);
        const page = Math.max(parseInt(query.page || '1', 10) || 1, 1);
        const limit = Math.max(parseInt(query.limit || '10', 10) || 10, 1);
        const skip = (page - 1) * limit;

        const baseWhere: Prisma.ShopOwnerWhereInput = {};

        if (query.search?.trim()) {
            const searchValue = query.search.trim();

            baseWhere.OR = [
                { shopName: { contains: searchValue, mode: 'insensitive' } },
                { ownerName: { contains: searchValue, mode: 'insensitive' } },
                { phone: { contains: searchValue, mode: 'insensitive' } },
                { email: { contains: searchValue, mode: 'insensitive' } },
                { shopSlug: { contains: searchValue, mode: 'insensitive' } },
            ];
        }

        if (query.isActive === 'true') {
            baseWhere.isActive = true;
        }

        if (query.isActive === 'false') {
            baseWhere.isActive = false;
        }

        const where: Prisma.ShopOwnerWhereInput =
            actor.role === Role.BRAND_OWNER
                ? {
                    AND: [
                        baseWhere,
                        {
                            brandLinks: {
                                some: {
                                    brandOwnerId: actor.brandOwnerId,
                                },
                            },
                        },
                    ],
                }
                : baseWhere;

        const [items, total] = await this.prisma.$transaction([
            this.prisma.shopOwner.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    brandLinks: actor.role === Role.BRAND_OWNER
                        ? {
                            where: {
                                brandOwnerId: actor.brandOwnerId,
                            },
                            select: {
                                id: true,
                                isActive: true,
                                createdAt: true,
                                updatedAt: true,
                                notes: true,
                            },
                        }
                        : {
                            select: {
                                id: true,
                                brandOwnerId: true,
                                shopOwnerId: true,
                                isActive: true,
                                createdAt: true,
                                updatedAt: true,
                                notes: true,
                            },
                        },
                },
            }),
            this.prisma.shopOwner.count({ where }),
        ]);

        return {
            message: 'Shop owners fetched successfully',
            data: items,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string, user: JwtUser) {
        const actor = await this.getActorScope(user);

        let where: Prisma.ShopOwnerWhereInput = { id };

        if (actor.role === Role.BRAND_OWNER) {
            where = {
                AND: [
                    { id },
                    {
                        brandLinks: {
                            some: {
                                brandOwnerId: actor.brandOwnerId,
                            },
                        },
                    },
                ],
            };
        }

        if (actor.role === Role.SHOP_OWNER) {
            where = {
                AND: [{ id }, { id: actor.shopOwnerId }],
            };
        }

        const shopOwner = await this.prisma.shopOwner.findFirst({
            where,
            include: {
                brandLinks: {
                    include: {
                        brandOwner: {
                            select: {
                                id: true,
                                businessName: true,
                                phone: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });

        if (!shopOwner) {
            throw new NotFoundException('Shop owner not found');
        }

        return {
            message: 'Shop owner fetched successfully',
            data: shopOwner,
        };
    }

    async update(id: string, dto: UpdateShopOwnerDto, user: JwtUser) {
        const actor = await this.getActorScope(user);

        let accessible = false;

        if (actor.role === Role.SUPER_ADMIN) {
            accessible = true;
        }

        if (actor.role === Role.BRAND_OWNER) {
            const link = await this.prisma.brandOwnerShop.findFirst({
                where: {
                    brandOwnerId: actor.brandOwnerId,
                    shopOwnerId: id,
                },
                select: { id: true },
            });

            accessible = !!link;
        }

        if (!accessible) {
            throw new NotFoundException('Shop owner not found');
        }

        if (dto.phone || dto.email || dto.shopSlug) {
            const existing = await this.prisma.shopOwner.findFirst({
                where: {
                    id: { not: id },
                    OR: [
                        ...(dto.phone ? [{ phone: dto.phone.trim() }] : []),
                        ...(dto.email ? [{ email: dto.email.trim().toLowerCase() }] : []),
                        ...(dto.shopSlug ? [{ shopSlug: dto.shopSlug.trim().toLowerCase() }] : []),
                    ],
                },
                select: { id: true },
            });

            if (existing) {
                throw new BadRequestException(
                    'Another shop owner already exists with the same phone, email, or shop slug',
                );
            }
        }

        const updated = await this.prisma.shopOwner.update({
            where: { id },
            data: {
                shopName: dto.shopName?.trim(),
                ownerName: dto.ownerName?.trim(),
                phone: dto.phone?.trim(),
                email: dto.email?.trim().toLowerCase(),
                address: dto.address?.trim(),
                city: dto.city?.trim(),
                state: dto.state?.trim(),
                country: dto.country?.trim(),
                postalCode: dto.postalCode?.trim(),
                shopSlug: dto.shopSlug?.trim().toLowerCase(),
                qrCodeUrl: dto.qrCodeUrl?.trim(),
                language: dto.language?.trim(),
                businessName: dto.businessName?.trim(),
                legalEntityName: dto.legalEntityName?.trim(),
                gstNumber: dto.gstNumber?.trim(),
            },
        });

        return {
            message: 'Shop owner updated successfully',
            data: updated,
        };
    }

    async updateStatus(id: string, dto: UpdateShopOwnerStatusDto, user: JwtUser) {
        const actor = await this.getActorScope(user);

        if (actor.role === Role.SUPER_ADMIN) {
            const updated = await this.prisma.shopOwner.update({
                where: { id },
                data: {
                    isActive: dto.isActive,
                },
            });

            return {
                message: 'Shop owner status updated successfully',
                data: updated,
            };
        }

        const brandOwnerId = await this.ensureBrandOwner(actor);

        const link = await this.prisma.brandOwnerShop.findFirst({
            where: {
                brandOwnerId,
                shopOwnerId: id,
            },
            select: { id: true },
        });

        if (!link) {
            throw new NotFoundException('Shop owner not found');
        }

        await this.prisma.brandOwnerShop.update({
            where: { id: link.id },
            data: {
                isActive: dto.isActive,
                notes: dto.notes,
            },
        });

        const updated = await this.prisma.shopOwner.findUnique({
            where: { id },
        });

        return {
            message: 'Shop owner link status updated successfully',
            data: updated,
        };
    }

    async orderSearch(search: string | undefined, user: JwtUser) {
        const actor = await this.getActorScope(user);

        if (actor.role !== Role.BRAND_OWNER && actor.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenException('You are not allowed to search shop owners for orders');
        }

        const where: Prisma.ShopOwnerWhereInput = {
            isActive: true,
        };

        if (actor.role === Role.BRAND_OWNER) {
            where.brandLinks = {
                some: {
                    brandOwnerId: actor.brandOwnerId,
                    isActive: true,
                },
            };
        }

        if (search?.trim()) {
            const searchValue = search.trim();

            where.AND = [
                {
                    OR: [
                        { shopName: { contains: searchValue, mode: 'insensitive' } },
                        { ownerName: { contains: searchValue, mode: 'insensitive' } },
                        { phone: { contains: searchValue, mode: 'insensitive' } },
                        { email: { contains: searchValue, mode: 'insensitive' } },
                        { shopSlug: { contains: searchValue, mode: 'insensitive' } },
                    ],
                },
            ];
        }

        const items = await this.prisma.shopOwner.findMany({
            where,
            take: 20,
            orderBy: {
                shopName: 'asc',
            },
            select: {
                id: true,
                shopName: true,
                ownerName: true,
                phone: true,
                email: true,
                shopSlug: true,
                city: true,
                state: true,
                isActive: true,
            },
        });

        return {
            message: 'Shop owners fetched successfully',
            data: items,
        };
    }
}