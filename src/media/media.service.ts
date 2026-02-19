/**
 * ---------------------------------------------------------
 * MEDIA SERVICE
 * ---------------------------------------------------------
 * Primary Responsibilities:
 *
 * 1. Attach media to either:
 *      - Product
 *      - Product Variant
 * 2. Enforce strict ownership rules (cannot belong to both)
 * 3. Maintain exactly ONE primary media per parent
 * 4. Prevent removal of the only primary media
 * 5. Auto-assign primary when none exists
 * 6. Maintain media ordering (sortOrder)
 *
 * Business Rules:
 * - Media must belong to either product OR variant (never both)
 * - Only one active primary media per parent
 * - Cannot disable the only primary image
 * - Soft-state consistency maintained via transactions
 *
 * Designed for scalable e-commerce media management.
 * ---------------------------------------------------------
 */
import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@Injectable()
export class MediaService {
    constructor(private prisma: PrismaService) { }

    /**
   * Create new media entry
   *
   * Flow:
   * Validate ownership (product OR variant)
   * Validate parent existence
   * Reset existing primary (if needed)
   * Create media
   * Ensure at least one primary exists
   */
    async create(dto: CreateMediaDto) {
        // Ownership validation: Must belong to product OR variant
        if (!dto.productId && !dto.variantId) {
            throw new BadRequestException(
                'Media must belong to product or variant',
            );
        }

        if (dto.productId && dto.variantId) {
            throw new BadRequestException(
                'Media cannot belong to both product and variant',
            );
        }

        // Validate parent existence
        if (dto.productId) {
            const product = await this.prisma.product.findUnique({
                where: { id: dto.productId },
            });

            if (!product) {
                throw new NotFoundException('Product not found');
            }
        }

        if (dto.variantId) {
            const variant = await this.prisma.productVariant.findUnique({
                where: { id: dto.variantId },
            });

            if (!variant) {
                throw new NotFoundException('Variant not found');
            }
        }

        // If primary, reset existing primary
        if (dto.isPrimary) {
            await this.prisma.media.updateMany({
                where: {
                    productId: dto.productId ?? undefined,
                    variantId: dto.variantId ?? undefined,
                    isPrimary: true,
                },
                data: { isPrimary: false },
            });
        }

        // Create media record
        const created = await this.prisma.media.create({
            data: {
                productId: dto.productId,
                variantId: dto.variantId,
                url: dto.url,
                altText: dto.altText,
                type: dto.type,
                isPrimary: dto.isPrimary ?? false,
                sortOrder: dto.sortOrder ?? 0,
            }
        });

        // Ensure at least one primary exists
        const parentFilter = created.productId
            ? { productId: created.productId }
            : { variantId: created.variantId };

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

    /**
   * Update media entry
   *
   * Rules enforced:
   * - Cannot disable the only primary image
   * - If setting new primary → reset others
   * - If no primary remains → auto assign oldest active
   *
   * Uses transaction for consistency.
   */
    async update(id: string, updateMediaDto: UpdateMediaDto) {
        const media = await this.prisma.media.findUnique({
            where: { id },
        });

        if (!media) {
            throw new NotFoundException('Media not found');
        }

        return this.prisma.$transaction(async (tx) => {
            const parentFilter = media.productId
                ? { productId: media.productId }
                : { variantId: media.variantId };

            // Prevent disabling ONLY primary
            if (
                media.isPrimary &&
                (updateMediaDto.isPrimary === false ||
                    updateMediaDto.isActive === false)
            ) {
                const otherPrimary = await tx.media.findFirst({
                    where: {
                        ...parentFilter,
                        isPrimary: true,
                        isActive: true,
                        NOT: { id },
                    },
                });

                if (!otherPrimary) {
                    throw new BadRequestException(
                        'Cannot disable the only primary image. Assign another primary first.',
                    );
                }
            }

            // Assign new primary if requested
            if (updateMediaDto.isPrimary === true) {
                await tx.media.updateMany({
                    where: {
                        ...parentFilter,
                        NOT: { id },
                    },
                    data: { isPrimary: false },
                });
            }

            const updated = await tx.media.update({
                where: { id },
                data: updateMediaDto,
            });

            // Auto assign primary if none exists
            const primaryExists = await tx.media.findFirst({
                where: {
                    ...parentFilter,
                    isPrimary: true,
                    isActive: true,
                },
            });

            if (!primaryExists) {
                const firstMedia = await tx.media.findFirst({
                    where: {
                        ...parentFilter,
                        isActive: true,
                    },
                    orderBy: { createdAt: 'asc' },
                });

                if (firstMedia) {
                    await tx.media.update({
                        where: { id: firstMedia.id },
                        data: { isPrimary: true },
                    });
                }
            }

            return updated;
        });
    }



}
