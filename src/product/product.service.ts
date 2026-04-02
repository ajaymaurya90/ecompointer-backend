/**
 * ---------------------------------------------------------
 * PRODUCT SERVICE
 * ---------------------------------------------------------
 * Primary Responsibilities:
 *
 * 1. Create products under a specific brand & category
 * 2. Validate brand and category integrity
 * 3. Enforce unique productCode per brand
 * 4. Fetch single product with:
 *      - Brand
 *      - Category
 *      - Product-level media
 *      - Variants + variant-level media
 * 5. Paginated product listing with optional brand filter
 * 6. Lightweight variant search for order creation
 * 7. Update product basic details
 * 8. Soft delete product (cascade deactivate variants)
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
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
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

        const category = await this.prisma.productCategory.findFirst({
            where: {
                id: dto.categoryId,
                brandOwnerId: brandOwner.id,
                isActive: true,
            },
        });

        if (!category) {
            throw new BadRequestException('Invalid category for this BrandOwner');
        }

        try {
            return await this.prisma.product.create({
                data: {
                    name: dto.name,
                    productCode: dto.productCode,
                    brandId: dto.brandId,
                    categoryId: dto.categoryId,
                    description: dto.description,
                    brandOwnerId: brandOwner.id,
                },
            });
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
   LIGHTWEIGHT ORDER SEARCH (OPTIMIZED)
   ===================================================== */
    async orderSearch(user: JwtUser, search?: string) {

        // Prevent heavy DB calls for empty or small search
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
                        in: allowedBrandOwnerIds.length ? allowedBrandOwnerIds : ['__none__'],
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

            take: 10, // 🔥 LIMIT RESULTS

            orderBy: [
                { sku: 'asc' },
                { product: { name: 'asc' } },
            ],

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
            variantLabel: [variant.size, variant.color].filter(Boolean).join(' ').trim() || null,
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
            taxRate: variant.taxRate,
            retailGross: variant.retailGross,
            wholesaleGross: variant.wholesaleGross,
            isActive: variant.isActive,
            shopOrderRules: {
                minLineQty: variant.product.brandOwner?.minShopOrderLineQty ?? 3,
                minCartQty: variant.product.brandOwner?.minShopOrderCartQty ?? 10,
                allowBelowMinLineQtyAfterCartMin:
                    variant.product.brandOwner?.allowBelowMinLineQtyAfterCartMin ?? true,
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
            include: {
                brand: true,
                category: true,
                variants: {
                    where: { isActive: true },
                    include: { media: true },
                },
                media: {
                    where: { isActive: true, variantId: null },
                },
            },
        });

        if (!product || !product.isActive) {
            throw new NotFoundException('Product not found');
        }

        await this.validateProductAccess(product.brand.brandOwnerId, user, false);

        return product;
    }

    /* =====================================================
       FIND ALL
       ===================================================== */
    async findAll(user: JwtUser, page: number, limit: number, filters: any) {
        const skip = (page - 1) * limit;

        const where: Prisma.ProductWhereInput = { isActive: true };
        const accessibleBrandOwnerIds = await this.getAccessibleBrandOwnerIds(user);

        where.brandOwnerId = {
            in: accessibleBrandOwnerIds.length ? accessibleBrandOwnerIds : ['__none__'],
        };

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { productCode: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters.categoryId) {
            where.categoryId = filters.categoryId;
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
                    variants: {
                        where: { isActive: true },
                        select: { stock: true },
                    },
                },
            }),
            this.prisma.product.count({ where }),
        ]);

        const data = products.map((p) => ({
            ...p,
            totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
        }));

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
        });

        if (!product || !product.isActive) {
            throw new NotFoundException('Product not found');
        }

        await this.validateProductAccess(product.brandOwnerId, user, true);

        if (dto.categoryId) {
            const category = await this.prisma.productCategory.findFirst({
                where: {
                    id: dto.categoryId,
                    brandOwnerId: product.brandOwnerId,
                    isActive: true,
                },
            });

            if (!category) {
                throw new BadRequestException(
                    'Category must belong to same BrandOwner',
                );
            }
        }

        if (dto.brandId) {
            const brand = await this.prisma.productBrand.findFirst({
                where: {
                    id: dto.brandId,
                    brandOwnerId: product.brandOwnerId,
                },
            });

            if (!brand) {
                throw new BadRequestException(
                    'Brand must belong to same BrandOwner',
                );
            }
        }

        try {
            return await this.prisma.product.update({
                where: { id: productId },
                data: dto,
            });
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
       DELETE (Soft)
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
       HELPERS
       ===================================================== */

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