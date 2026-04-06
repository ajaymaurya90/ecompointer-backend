/**
 * ---------------------------------------------------------
 * PRODUCT SERVICE
 * ---------------------------------------------------------
 * Primary Responsibilities:
 *
 * 1. Create products under a specific brand & primary category
 * 2. Maintain multi-category assignments through join table
 * 3. Enforce unique productCode per brand
 * 4. Fetch single product with relations + category assignments
 * 5. Paginated product listing with optional filters
 * 6. Lightweight variant search for order creation
 * 7. Update product basic details + category assignment sync
 * 8. Soft delete product
 * 9. Suggest next product code for create flow
 * ---------------------------------------------------------
 */
import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import type { JwtUser } from 'src/auth/types/jwt-user.type';

@Injectable()
export class ProductService {
    constructor(private prisma: PrismaService) { }

    /* =====================================================
       CREATE PRODUCT
       ===================================================== */
    async create(dto: CreateProductDto, user: JwtUser) {
        const brandOwner = await this.getBrandOwnerProfile(user);

        const brand = await this.prisma.productBrand.findUnique({
            where: { id: dto.brandId },
        });

        if (!brand || brand.brandOwnerId !== brandOwner.id) {
            throw new ForbiddenException('Not your brand');
        }

        // Build final category set. Primary category must always be included.
        const finalCategoryIds = this.buildFinalCategoryIds(
            dto.categoryId,
            dto.categoryIds,
        );

        // Validate all selected categories belong to same BrandOwner.
        await this.validateCategoryIdsForBrandOwner(
            finalCategoryIds,
            brandOwner.id,
        );

        try {
            const createdProduct = await this.prisma.$transaction(async (tx) => {
                // Create product with primary/default category.
                const product = await tx.product.create({
                    data: {
                        name: dto.name,
                        productCode: dto.productCode,
                        brandId: dto.brandId,
                        categoryId: dto.categoryId,
                        description: dto.description,
                        brandOwnerId: brandOwner.id,
                    },
                });

                // Create all category assignment rows including primary category.
                await tx.productCategoryAssignment.createMany({
                    data: finalCategoryIds.map((categoryId) => ({
                        productId: product.id,
                        categoryId,
                    })),
                    skipDuplicates: true,
                });

                return tx.product.findUnique({
                    where: { id: product.id },
                    include: this.getProductDetailInclude(),
                });
            });

            if (!createdProduct) {
                throw new NotFoundException('Product not found after creation');
            }

            return this.mapProductResponse(createdProduct);
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new BadRequestException(
                    `Product code "${dto.productCode}" already exists for this brand`,
                );
            }

            throw error;
        }
    }

    /* =====================================================
       SUGGEST NEXT PRODUCT CODE
       ===================================================== */
    async suggestNextProductCode(user: JwtUser) {
        await this.getBrandOwnerProfile(user);

        // Build prefix as PRD + YY + MM.
        const now = new Date();
        const year = String(now.getFullYear()).slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `PRD${year}${month}`;

        // Find latest product code for current prefix.
        const latestProduct = await this.prisma.product.findFirst({
            where: {
                productCode: {
                    startsWith: prefix,
                },
            },
            orderBy: {
                productCode: 'desc',
            },
            select: {
                productCode: true,
            },
        });

        let nextSequence = 1;

        if (latestProduct?.productCode) {
            const match = latestProduct.productCode.match(
                new RegExp(`^${prefix}(\\d{5})$`),
            );

            if (match) {
                nextSequence = Number(match[1]) + 1;
            }
        }

        const suggestedCode = `${prefix}${String(nextSequence).padStart(5, '0')}`;

        return {
            code: suggestedCode,
            prefix,
            sequence: nextSequence,
        };
    }

    /* =====================================================
       LIGHTWEIGHT ORDER SEARCH
       ===================================================== */
    async orderSearch(user: JwtUser, search?: string) {
        if (!search || search.trim().length < 2) {
            return {
                message: 'Type at least 2 characters to search',
                data: [],
            };
        }

        const searchValue = search.trim();
        const allowedBrandOwnerIds = await this.getAccessibleBrandOwnerIds(user);

        const variants = await this.prisma.productVariant.findMany({
            where: {
                isActive: true,
                product: {
                    isActive: true,
                    brandOwnerId: {
                        in: allowedBrandOwnerIds.length
                            ? allowedBrandOwnerIds
                            : ['__none__'],
                    },
                },
                OR: [
                    {
                        sku: {
                            contains: searchValue,
                            mode: 'insensitive',
                        },
                    },
                    {
                        product: {
                            productCode: {
                                contains: searchValue,
                                mode: 'insensitive',
                            },
                        },
                    },
                    {
                        product: {
                            name: {
                                contains: searchValue,
                                mode: 'insensitive',
                            },
                        },
                    },
                ],
            },
            take: 10,
            orderBy: [{ sku: 'asc' }, { product: { name: 'asc' } }],
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        productCode: true,
                        brandOwnerId: true,
                        brandOwner: {
                            select: {
                                minShopOrderLineQty: true,
                                minShopOrderCartQty: true,
                                allowBelowMinLineQtyAfterCartMin: true,
                            },
                        },
                        brand: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        const data = variants.map((variant) => ({
            id: variant.id,
            productId: variant.product.id,
            productName: variant.product.name,
            productCode: variant.product.productCode,
            brandOwnerId: variant.product.brandOwnerId,
            brand: variant.product.brand,
            sku: variant.sku,
            variantLabel:
                [variant.size, variant.color].filter(Boolean).join(' ').trim() ||
                null,
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
            taxRate: variant.taxRate,
            retailGross: variant.retailGross,
            wholesaleGross: variant.wholesaleGross,
            isActive: variant.isActive,
            shopOrderRules: {
                minLineQty:
                    variant.product.brandOwner?.minShopOrderLineQty ?? 3,
                minCartQty:
                    variant.product.brandOwner?.minShopOrderCartQty ?? 10,
                allowBelowMinLineQtyAfterCartMin:
                    variant.product.brandOwner
                        ?.allowBelowMinLineQtyAfterCartMin ?? true,
            },
        }));

        return {
            message: 'Order search products fetched successfully',
            data,
        };
    }

    /* =====================================================
       FIND ONE
       ===================================================== */
    async findOne(productId: string, user: JwtUser) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            include: this.getProductDetailInclude(),
        });

        if (!product || !product.isActive) {
            throw new NotFoundException('Product not found');
        }

        await this.validateProductAccess(product.brand.brandOwnerId, user, false);

        return this.mapProductResponse(product);
    }

    /* =====================================================
       FIND ALL
       ===================================================== */
    async findAll(user: JwtUser, page: number, limit: number, filters: any) {
        const skip = (page - 1) * limit;
        const where: Prisma.ProductWhereInput = { isActive: true };
        const accessibleBrandOwnerIds = await this.getAccessibleBrandOwnerIds(user);

        where.brandOwnerId = {
            in: accessibleBrandOwnerIds.length
                ? accessibleBrandOwnerIds
                : ['__none__'],
        };

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { productCode: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        // Filter by assigned category, not only primary category.
        if (filters.categoryId) {
            where.categoryAssignments = {
                some: {
                    categoryId: filters.categoryId,
                },
            };
        }

        const allowedSortFields = ['createdAt', 'name', 'productCode'];
        const sortBy = allowedSortFields.includes(filters.sortBy || '')
            ? filters.sortBy!
            : 'createdAt';

        const order = filters.order === 'asc' ? 'asc' : 'desc';

        const [products, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: order },
                include: {
                    brand: true,
                    category: true,
                    categoryAssignments: {
                        include: {
                            category: {
                                select: {
                                    id: true,
                                    name: true,
                                    parentId: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: 'asc',
                        },
                    },
                    variants: {
                        where: { isActive: true },
                        select: { stock: true },
                    },
                },
            }),
            this.prisma.product.count({ where }),
        ]);

        const data = products.map((product) =>
            this.mapProductListResponse(product),
        );

        return {
            data,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    /* =====================================================
       UPDATE
       ===================================================== */
    async update(productId: string, dto: UpdateProductDto, user: JwtUser) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            select: {
                id: true,
                brandId: true,
                brandOwnerId: true,
                categoryId: true,
                isActive: true,
                categoryAssignments: {
                    select: {
                        categoryId: true,
                    },
                },
            },
        });

        if (!product || !product.isActive) {
            throw new NotFoundException('Product not found');
        }

        await this.validateProductAccess(product.brandOwnerId, user, true);

        const nextBrandId = dto.brandId ?? product.brandId;
        const nextPrimaryCategoryId = dto.categoryId ?? product.categoryId;

        // Resolve final category assignments. If categoryIds not sent,
        // keep existing assignments and ensure primary category is included.
        const existingCategoryIds = product.categoryAssignments.map(
            (item) => item.categoryId,
        );

        const nextCategoryIds = this.buildFinalCategoryIds(
            nextPrimaryCategoryId,
            dto.categoryIds ?? existingCategoryIds,
        );

        if (dto.brandId) {
            const brand = await this.prisma.productBrand.findFirst({
                where: {
                    id: nextBrandId,
                    brandOwnerId: product.brandOwnerId,
                },
            });

            if (!brand) {
                throw new BadRequestException(
                    'Brand must belong to same BrandOwner',
                );
            }
        }

        // Validate all chosen categories belong to same BrandOwner.
        await this.validateCategoryIdsForBrandOwner(
            nextCategoryIds,
            product.brandOwnerId,
        );

        try {
            const updatedProduct = await this.prisma.$transaction(async (tx) => {
                // Update product base data including primary/default category.
                await tx.product.update({
                    where: { id: productId },
                    data: {
                        ...(dto.name !== undefined ? { name: dto.name } : {}),
                        ...(dto.productCode !== undefined
                            ? { productCode: dto.productCode }
                            : {}),
                        ...(dto.description !== undefined
                            ? { description: dto.description }
                            : {}),
                        ...(dto.brandId !== undefined ? { brandId: dto.brandId } : {}),
                        categoryId: nextPrimaryCategoryId,
                    },
                });

                // Replace assignment set with final submitted set.
                await tx.productCategoryAssignment.deleteMany({
                    where: {
                        productId,
                    },
                });

                await tx.productCategoryAssignment.createMany({
                    data: nextCategoryIds.map((categoryId) => ({
                        productId,
                        categoryId,
                    })),
                    skipDuplicates: true,
                });

                return tx.product.findUnique({
                    where: { id: productId },
                    include: this.getProductDetailInclude(),
                });
            });

            if (!updatedProduct) {
                throw new NotFoundException('Product not found after update');
            }

            return this.mapProductResponse(updatedProduct);
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new BadRequestException(
                    `Product code "${dto.productCode}" already exists for this brand`,
                );
            }

            throw error;
        }
    }

    /* =====================================================
       DELETE (SOFT)
       ===================================================== */
    async remove(productId: string, user: JwtUser) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            include: { brand: true },
        });

        if (!product || !product.isActive) {
            throw new NotFoundException('Product not found');
        }

        await this.validateProductAccess(product.brand.brandOwnerId, user, true);

        return this.prisma.product.update({
            where: { id: productId },
            data: {
                isActive: false,
                variants: {
                    updateMany: {
                        where: {},
                        data: { isActive: false },
                    },
                },
            },
        });
    }

    /* =====================================================
       RESPONSE MAPPERS
       ===================================================== */

    // Shared include for create/update/findOne detail-level product response.
    private getProductDetailInclude(): Prisma.ProductInclude {
        return {
            brand: true,
            category: true,
            categoryAssignments: {
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            parentId: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'asc',
                },
            },
            variants: {
                where: { isActive: true },
                include: { media: true },
            },
            media: {
                where: { isActive: true, variantId: null },
            },
        };
    }

    // Normalize product payload so frontend always gets categoryIds directly.
    private mapProductResponse(product: any) {
        return {
            ...product,
            categoryIds:
                product.categoryAssignments?.map(
                    (item: any) => item.categoryId,
                ) ?? [],
        };
    }

    // Lightweight mapper for list responses while still exposing categoryIds.
    private mapProductListResponse(product: any) {
        return {
            ...product,
            categoryIds:
                product.categoryAssignments?.map(
                    (item: any) => item.categoryId,
                ) ?? [],
            totalStock:
                product.variants?.reduce(
                    (sum: number, variant: { stock: number }) =>
                        sum + variant.stock,
                    0,
                ) ?? 0,
            variantCount: product.variants?.length ?? 0,
        };
    }

    /* =====================================================
       HELPERS
       ===================================================== */

    // Build final assignment set and force primary category to exist inside it.
    private buildFinalCategoryIds(
        primaryCategoryId: string,
        categoryIds?: string[],
    ) {
        const finalIds = new Set<string>([primaryCategoryId]);

        for (const categoryId of categoryIds ?? []) {
            if (categoryId) {
                finalIds.add(categoryId);
            }
        }

        return [...finalIds];
    }

    // Validate that all category ids exist, are active, and belong to the same BO.
    private async validateCategoryIdsForBrandOwner(
        categoryIds: string[],
        brandOwnerId: string,
    ) {
        const categories = await this.prisma.productCategory.findMany({
            where: {
                id: { in: categoryIds },
                brandOwnerId,
                isActive: true,
            },
            select: { id: true },
        });

        if (categories.length !== categoryIds.length) {
            throw new BadRequestException(
                'One or more selected categories are invalid for this BrandOwner',
            );
        }
    }

    private async getBrandOwnerProfile(user: JwtUser) {
        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { userId: user.id },
        });

        if (!brandOwner) {
            throw new ForbiddenException('BrandOwner profile not found');
        }

        return brandOwner;
    }

    private async getShopOwnerProfile(user: JwtUser) {
        const shopOwner = await this.prisma.shopOwner.findUnique({
            where: { userId: user.id },
        });

        if (!shopOwner) {
            throw new ForbiddenException('ShopOwner profile not found');
        }

        return shopOwner;
    }

    private async getAccessibleBrandOwnerIds(user: JwtUser) {
        if (user.role === Role.SUPER_ADMIN) {
            const owners = await this.prisma.brandOwner.findMany({
                where: { isActive: true },
                select: { id: true },
            });

            return owners.map((owner) => owner.id);
        }

        if (user.role === Role.BRAND_OWNER) {
            const brandOwner = await this.getBrandOwnerProfile(user);
            return [brandOwner.id];
        }

        if (user.role === Role.SHOP_OWNER) {
            const shopOwner = await this.getShopOwnerProfile(user);

            const links = await this.prisma.brandOwnerShop.findMany({
                where: {
                    shopOwnerId: shopOwner.id,
                    isActive: true,
                },
                select: { brandOwnerId: true },
            });

            return links.map((link) => link.brandOwnerId);
        }

        throw new ForbiddenException('Access denied');
    }

    private async validateProductAccess(
        brandOwnerId: string,
        user: JwtUser,
        requireOwnership: boolean,
    ) {
        if (user.role === Role.SUPER_ADMIN) return;

        if (user.role === Role.BRAND_OWNER) {
            const brandOwner = await this.getBrandOwnerProfile(user);

            if (brandOwner.id !== brandOwnerId) {
                throw new ForbiddenException('Access denied');
            }

            return;
        }

        if (user.role === Role.SHOP_OWNER) {
            if (requireOwnership) {
                throw new ForbiddenException('Access denied');
            }

            const shopOwner = await this.getShopOwnerProfile(user);

            const link = await this.prisma.brandOwnerShop.findFirst({
                where: {
                    shopOwnerId: shopOwner.id,
                    brandOwnerId,
                    isActive: true,
                },
            });

            if (!link) {
                throw new ForbiddenException('Access denied');
            }

            return;
        }

        throw new ForbiddenException('Access denied');
    }
}