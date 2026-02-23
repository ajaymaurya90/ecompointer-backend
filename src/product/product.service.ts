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
 * 6. Update product basic details
 * 7. Soft delete product (cascade deactivate variants)
 *
 * Business Rules Enforced:
 * - Product must belong to a valid brand
 * - Category must belong to same brand
 * - Product code must be unique per brand
 * - Only active products & variants are returned
 * - Deletion is soft-delete (isActive flag)
 *
 * Designed for scalable e-commerce product architecture.
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

        if (!brand || brand.ownerId !== brandOwner.id) {
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
            throw new BadRequestException('Invalid category for this brand');
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
                    'Product code already exists for this brand',
                );
            }
            throw error;
        }
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

        await this.validateProductAccess(product.brand.ownerId, user, false);

        return product;
    }

    /* =====================================================
       FIND ALL
       ===================================================== */
    async findAll(user: JwtUser, page: number, limit: number, filters: any) {
        const skip = (page - 1) * limit;

        const where: any = { isActive: true };

        if (user.role === Role.BRAND_OWNER) {
            const brandOwner = await this.getBrandOwnerProfile(user);
            where.brandOwnerId = brandOwner.id;
        }

        if (user.role === Role.SHOP_OWNER) {
            const links = await this.prisma.brandOwnerShop.findMany({
                where: { shopOwnerId: user.id, isActive: true },
                select: { brandOwnerId: true },
            });

            const ownerIds = links.map(l => l.brandOwnerId);

            where.brandOwnerId = {
                in: ownerIds.length ? ownerIds : ['__none__'],
            };
        }

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { productCode: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters.categoryId) {
            where.categoryId = filters.categoryId;
        }

        const [products, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [filters.sortBy || 'createdAt']: filters.order || 'desc' },
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

        const data = products.map(p => ({
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

        // Validate ownership using product.brandOwnerId directly
        await this.validateProductAccess(product.brandOwnerId, user, true);

        /* ---------------------------------------------------
           If category is being changed
        --------------------------------------------------- */
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

        /* ---------------------------------------------------
           If brand is being changed (important!)
        --------------------------------------------------- */
        if (dto.brandId) {
            const brand = await this.prisma.productBrand.findFirst({
                where: {
                    id: dto.brandId,
                    ownerId: product.brandOwnerId,
                },
            });

            if (!brand) {
                throw new BadRequestException(
                    'Brand must belong to same BrandOwner',
                );
            }
        }

        return this.prisma.product.update({
            where: { id: productId },
            data: dto,
        });
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

        await this.validateProductAccess(product.brand.ownerId, user, true);

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

            const link = await this.prisma.brandOwnerShop.findFirst({
                where: {
                    shopOwnerId: user.id,
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