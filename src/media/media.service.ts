import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@Injectable()
export class MediaService {
    constructor(private prisma: PrismaService) { }

    // =============================
    // CREATE MEDIA
    // =============================
    async create(dto: CreateMediaDto, userId: string) {
        if (!dto.productId && !dto.variantId) {
            throw new BadRequestException('Media must belong to product or variant');
        }

        if (dto.productId && dto.variantId) {
            throw new BadRequestException('Cannot belong to both product and variant');
        }

        if (dto.productId) {
            const product = await this.prisma.product.findFirst({
                where: {
                    id: dto.productId,
                    brandOwner: {
                        userId,
                    },
                    isActive: true,
                },
            });

            if (!product) {
                throw new ForbiddenException('You do not own this product');
            }
        }

        if (dto.variantId) {
            const variant = await this.prisma.productVariant.findFirst({
                where: {
                    id: dto.variantId,
                    isActive: true,
                    product: {
                        brandOwner: {
                            userId,
                        },
                        isActive: true,
                    },
                },
            });

            if (!variant) {
                throw new ForbiddenException('You do not own this variant');
            }
        }

        const parentFilter = dto.productId
            ? { productId: dto.productId }
            : { variantId: dto.variantId };

        const lastMedia = await this.prisma.media.findFirst({
            where: {
                ...parentFilter,
                isActive: true,
            },
            orderBy: { sortOrder: 'desc' },
        });

        const nextSort = lastMedia ? lastMedia.sortOrder + 1 : 1;

        if (dto.isPrimary) {
            await this.prisma.media.updateMany({
                where: {
                    ...parentFilter,
                    isActive: true,
                },
                data: { isPrimary: false },
            });
        }

        const created = await this.prisma.media.create({
            data: {
                ...parentFilter,
                url: dto.url,
                altText: dto.altText,
                type: dto.type ?? 'GALLERY',
                mimeType: dto.mimeType,
                size: dto.size,
                isPrimary: dto.isPrimary ?? false,
                sortOrder: dto.sortOrder ?? nextSort,
            },
        });

        const primaryExists = await this.prisma.media.findFirst({
            where: {
                ...parentFilter,
                isPrimary: true,
                isActive: true,
            },
        });

        if (!primaryExists) {
            await this.prisma.media.update({
                where: { id: created.id },
                data: { isPrimary: true },
            });
        }

        return created;
    }

    // =============================
    // UPDATE MEDIA
    // =============================
    async update(id: string, dto: UpdateMediaDto, userId: string) {
        const media = await this.prisma.media.findUnique({
            where: { id },
            include: {
                product: { include: { brandOwner: true } },
                variant: {
                    include: {
                        product: { include: { brandOwner: true } },
                    },
                },
            },
        });

        if (!media || !media.isActive) {
            throw new NotFoundException('Media not found');
        }

        const ownerUserId =
            media.product?.brandOwner?.userId ||
            media.variant?.product?.brandOwner?.userId;

        if (ownerUserId !== userId) {
            throw new ForbiddenException('You do not own this media');
        }

        const parentFilter = media.productId
            ? { productId: media.productId }
            : { variantId: media.variantId };

        return this.prisma.$transaction(async (tx) => {
            if (dto.isPrimary === true) {
                await tx.media.updateMany({
                    where: {
                        ...parentFilter,
                        isActive: true,
                    },
                    data: { isPrimary: false },
                });
            }

            const updated = await tx.media.update({
                where: { id },
                data: dto,
            });

            const primaryExists = await tx.media.findFirst({
                where: {
                    ...parentFilter,
                    isPrimary: true,
                    isActive: true,
                },
            });

            if (!primaryExists) {
                await tx.media.update({
                    where: { id: updated.id },
                    data: { isPrimary: true },
                });
            }

            return updated;
        });
    }

    // =============================
    // DELETE MEDIA (SOFT)
    // =============================
    async remove(id: string, userId: string) {
        const media = await this.prisma.media.findUnique({
            where: { id },
            include: {
                product: { include: { brandOwner: true } },
                variant: {
                    include: {
                        product: { include: { brandOwner: true } },
                    },
                },
            },
        });

        if (!media || !media.isActive) {
            throw new NotFoundException('Media not found');
        }

        const ownerUserId =
            media.product?.brandOwner?.userId ||
            media.variant?.product?.brandOwner?.userId;

        if (ownerUserId !== userId) {
            throw new ForbiddenException('You do not own this media');
        }

        const parentFilter = media.productId
            ? { productId: media.productId }
            : { variantId: media.variantId };

        return this.prisma.$transaction(async (tx) => {
            const deleted = await tx.media.update({
                where: { id },
                data: {
                    isActive: false,
                    isPrimary: false,
                },
            });

            const activeMedia = await tx.media.findMany({
                where: {
                    ...parentFilter,
                    isActive: true,
                },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            });

            const primaryExists = activeMedia.some((item) => item.isPrimary);

            if (!primaryExists && activeMedia.length > 0) {
                await tx.media.update({
                    where: { id: activeMedia[0].id },
                    data: { isPrimary: true },
                });
            }

            return deleted;
        });
    }

    // =============================
    // FETCH MEDIA
    // =============================
    async getProductMedia(productId: string, userId: string) {
        const product = await this.prisma.product.findFirst({
            where: {
                id: productId,
                isActive: true,
                brandOwner: { userId },
            },
        });

        if (!product) {
            throw new ForbiddenException('You do not own this product');
        }

        return this.prisma.media.findMany({
            where: {
                productId,
                isActive: true,
            },
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        });
    }

    async getVariantMedia(variantId: string, userId: string) {
        const variant = await this.prisma.productVariant.findFirst({
            where: {
                id: variantId,
                isActive: true,
                product: {
                    isActive: true,
                    brandOwner: { userId },
                },
            },
        });

        if (!variant) {
            throw new ForbiddenException('You do not own this variant');
        }

        return this.prisma.media.findMany({
            where: {
                variantId,
                isActive: true,
            },
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        });
    }
}