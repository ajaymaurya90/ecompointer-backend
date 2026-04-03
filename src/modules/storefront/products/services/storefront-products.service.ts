import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { StorefrontProductQueryDto } from '../dto/storefront-product-query.dto';

@Injectable()
export class StorefrontProductsService {
    constructor(private readonly prisma: PrismaService) { }

    /* =====================================================
       GET STOREFRONT PRODUCT LIST
       ===================================================== */
    async findAll(
        brandOwnerId: string,
        query: StorefrontProductQueryDto,
    ) {
        // Ensure the brand owner exists and storefront can be queried.
        await this.assertBrandOwnerStorefrontAvailable(brandOwnerId);

        const page = query.page ?? 1;
        const limit = query.limit ?? 12;
        const skip = (page - 1) * limit;

        // Build storefront-safe filtering rules for active products only.
        const where: Prisma.ProductWhereInput = {
            brandOwnerId,
            isActive: true,
            variants: {
                some: {
                    isActive: true,
                },
            },
        };

        // Apply search filter on product name and product code when provided.
        if (query.search?.trim()) {
            const search = query.search.trim();

            where.OR = [
                {
                    name: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    productCode: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
            ];
        }

        // Apply category filter when a category is selected.
        if (query.categoryId) {
            where.categoryId = query.categoryId;
        }

        // Load paginated storefront product records and total count together.
        const [products, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    brand: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    media: {
                        where: {
                            isActive: true,
                            variantId: null,
                        },
                        orderBy: [
                            { isPrimary: 'desc' },
                            { sortOrder: 'asc' },
                            { createdAt: 'asc' },
                        ],
                        take: 1,
                        select: {
                            id: true,
                            url: true,
                            altText: true,
                            isPrimary: true,
                        },
                    },
                    variants: {
                        where: {
                            isActive: true,
                        },
                        orderBy: {
                            createdAt: 'asc',
                        },
                        select: {
                            id: true,
                            sku: true,
                            size: true,
                            color: true,
                            retailGross: true,
                            stock: true,
                            taxRate: true,
                            media: {
                                where: {
                                    isActive: true,
                                },
                                orderBy: [
                                    { isPrimary: 'desc' },
                                    { sortOrder: 'asc' },
                                    { createdAt: 'asc' },
                                ],
                                take: 1,
                                select: {
                                    id: true,
                                    url: true,
                                    altText: true,
                                    isPrimary: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.product.count({ where }),
        ]);

        // Map admin-oriented product records into lightweight storefront cards.
        const data = products.map((product) => {
            const firstVariant = product.variants[0] ?? null;
            const primaryProductImage = product.media[0] ?? null;
            const primaryVariantImage = firstVariant?.media?.[0] ?? null;

            const minPrice =
                product.variants.length > 0
                    ? Math.min(...product.variants.map((variant) => variant.retailGross))
                    : 0;

            const maxPrice =
                product.variants.length > 0
                    ? Math.max(...product.variants.map((variant) => variant.retailGross))
                    : 0;

            const totalStock = product.variants.reduce(
                (sum, variant) => sum + variant.stock,
                0,
            );

            return {
                id: product.id,
                name: product.name,
                productCode: product.productCode,
                description: product.description,
                brandOwnerId: product.brandOwnerId,
                brand: product.brand,
                category: product.category,
                image:
                    primaryProductImage?.url ||
                    primaryVariantImage?.url ||
                    null,
                imageAlt:
                    primaryProductImage?.altText ||
                    primaryVariantImage?.altText ||
                    product.name,
                price: {
                    min: minPrice,
                    max: maxPrice,
                    currencyCode: 'INR',
                },
                totalStock,
                hasMultipleVariants: product.variants.length > 1,
                variantCount: product.variants.length,
            };
        });

        return {
            message: 'Storefront products fetched successfully',
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /* =====================================================
       GET STOREFRONT PRODUCT DETAIL
       ===================================================== */
    async findOne(
        brandOwnerId: string,
        productId: string,
    ) {
        // Ensure the brand owner exists and storefront can be queried.
        await this.assertBrandOwnerStorefrontAvailable(brandOwnerId);

        // Load one active product with storefront-safe relations and variants.
        const product = await this.prisma.product.findFirst({
            where: {
                id: productId,
                brandOwnerId,
                isActive: true,
                variants: {
                    some: {
                        isActive: true,
                    },
                },
            },
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                media: {
                    where: {
                        isActive: true,
                        variantId: null,
                    },
                    orderBy: [
                        { isPrimary: 'desc' },
                        { sortOrder: 'asc' },
                        { createdAt: 'asc' },
                    ],
                    select: {
                        id: true,
                        url: true,
                        altText: true,
                        type: true,
                        isPrimary: true,
                        sortOrder: true,
                    },
                },
                variants: {
                    where: {
                        isActive: true,
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                    include: {
                        media: {
                            where: {
                                isActive: true,
                            },
                            orderBy: [
                                { isPrimary: 'desc' },
                                { sortOrder: 'asc' },
                                { createdAt: 'asc' },
                            ],
                            select: {
                                id: true,
                                url: true,
                                altText: true,
                                type: true,
                                isPrimary: true,
                                sortOrder: true,
                            },
                        },
                        attributeValues: {
                            include: {
                                attributeValue: {
                                    include: {
                                        attribute: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Stop when the requested storefront product does not exist.
        if (!product) {
            throw new NotFoundException('Storefront product not found');
        }

        // Map full product detail into storefront-friendly response shape.
        const data = {
            id: product.id,
            name: product.name,
            productCode: product.productCode,
            description: product.description,
            brandOwnerId: product.brandOwnerId,
            brand: product.brand,
            category: product.category,
            media: product.media.map((media) => ({
                id: media.id,
                url: media.url,
                altText: media.altText,
                type: media.type,
                isPrimary: media.isPrimary,
                sortOrder: media.sortOrder,
            })),
            variants: product.variants.map((variant) => ({
                id: variant.id,
                sku: variant.sku,
                size: variant.size,
                color: variant.color,
                taxRate: variant.taxRate,
                retailGross: variant.retailGross,
                stock: variant.stock,
                inStock: variant.stock > 0,
                media: variant.media.map((media) => ({
                    id: media.id,
                    url: media.url,
                    altText: media.altText,
                    type: media.type,
                    isPrimary: media.isPrimary,
                    sortOrder: media.sortOrder,
                })),
                attributes: variant.attributeValues.map((entry) => ({
                    attributeId: entry.attributeValue.attribute.id,
                    attributeName: entry.attributeValue.attribute.name,
                    attributeValueId: entry.attributeValue.id,
                    attributeValue: entry.attributeValue.value,
                })),
            })),
            price: {
                min: Math.min(...product.variants.map((variant) => variant.retailGross)),
                max: Math.max(...product.variants.map((variant) => variant.retailGross)),
                currencyCode: 'INR',
            },
        };

        return {
            message: 'Storefront product fetched successfully',
            data,
        };
    }

    /* =====================================================
       HELPERS
       ===================================================== */
    private async assertBrandOwnerStorefrontAvailable(brandOwnerId: string) {
        // Load BO active state and storefront setting state before catalog access.
        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { id: brandOwnerId },
            select: {
                id: true,
                isActive: true,
                storefrontSetting: {
                    select: {
                        isStorefrontEnabled: true,
                    },
                },
            },
        });

        // Stop when BO does not exist.
        if (!brandOwner) {
            throw new NotFoundException('Storefront not found');
        }

        // Prevent catalog access for inactive BO records.
        if (!brandOwner.isActive) {
            throw new BadRequestException('Storefront is not available');
        }

        // Prevent catalog access when storefront is explicitly disabled.
        if (brandOwner.storefrontSetting?.isStorefrontEnabled === false) {
            throw new BadRequestException('Storefront is disabled');
        }
    }
}