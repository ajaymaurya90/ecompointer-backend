import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StorefrontCategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    /* =====================================================
       GET STOREFRONT CATEGORY LIST
       ===================================================== */
    async findAll(brandOwnerId: string) {
        // Ensure the brand owner exists and storefront can be queried.
        await this.assertBrandOwnerStorefrontAvailable(brandOwnerId);

        // Load all active categories for the brand owner with child categories.
        const categories = await this.prisma.productCategory.findMany({
            where: {
                brandOwnerId,
                isActive: true,
            },
            orderBy: [
                { parentId: 'asc' },
                { position: 'asc' },
                { name: 'asc' },
            ],
            include: {
                children: {
                    where: {
                        isActive: true,
                    },
                    orderBy: [
                        { position: 'asc' },
                        { name: 'asc' },
                    ],
                    include: {
                        _count: {
                            select: {
                                products: {
                                    where: {
                                        isActive: true,
                                    },
                                },
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        products: {
                            where: {
                                isActive: true,
                            },
                        },
                    },
                },
            },
        });

        // Keep only categories that have active products or useful child categories.
        const filteredCategories = categories.filter((category) => {
            const hasOwnProducts = category._count.products > 0;
            const hasActiveChildren = category.children.length > 0;
            return hasOwnProducts || hasActiveChildren;
        });

        // Split categories into root-level navigation items.
        const rootCategories = filteredCategories.filter(
            (category) => category.parentId === null,
        );

        // Map categories into storefront-friendly navigation structure.
        const data = rootCategories.map((category) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            position: category.position,
            productCount: category._count.products,
            children: category.children
                .filter((child) => child._count.products > 0)
                .map((child) => ({
                    id: child.id,
                    name: child.name,
                    description: child.description,
                    position: child.position,
                    productCount: child._count.products,
                })),
        }));

        return {
            message: 'Storefront categories fetched successfully',
            data,
        };
    }

    /* =====================================================
       GET STOREFRONT CATEGORY DETAIL
       ===================================================== */
    async findOne(
        brandOwnerId: string,
        categoryId: string,
    ) {
        // Ensure the brand owner exists and storefront can be queried.
        await this.assertBrandOwnerStorefrontAvailable(brandOwnerId);

        // Load one active category with parent, children, and active product count.
        const category = await this.prisma.productCategory.findFirst({
            where: {
                id: categoryId,
                brandOwnerId,
                isActive: true,
            },
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                children: {
                    where: {
                        isActive: true,
                    },
                    orderBy: [
                        { position: 'asc' },
                        { name: 'asc' },
                    ],
                    include: {
                        _count: {
                            select: {
                                products: {
                                    where: {
                                        isActive: true,
                                    },
                                },
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        products: {
                            where: {
                                isActive: true,
                            },
                        },
                    },
                },
            },
        });

        // Stop when category does not exist for this storefront.
        if (!category) {
            throw new NotFoundException('Storefront category not found');
        }

        // Build storefront-friendly detail payload for category pages.
        const data = {
            id: category.id,
            name: category.name,
            description: category.description,
            position: category.position,
            productCount: category._count.products,
            parent: category.parent,
            children: category.children.map((child) => ({
                id: child.id,
                name: child.name,
                description: child.description,
                position: child.position,
                productCount: child._count.products,
            })),
        };

        return {
            message: 'Storefront category fetched successfully',
            data,
        };
    }

    /* =====================================================
       HELPERS
       ===================================================== */
    private async assertBrandOwnerStorefrontAvailable(brandOwnerId: string) {
        // Load BO active state and storefront setting state before category access.
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

        // Prevent category access for inactive BO records.
        if (!brandOwner.isActive) {
            throw new BadRequestException('Storefront is not available');
        }

        // Prevent category access when storefront is explicitly disabled.
        if (brandOwner.storefrontSetting?.isStorefrontEnabled === false) {
            throw new BadRequestException('Storefront is disabled');
        }
    }
}