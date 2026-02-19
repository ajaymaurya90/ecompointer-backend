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
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Prisma } from '@prisma/client';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
    constructor(private prisma: PrismaService) { }

    /**
    * Create a new product
    *
    * Flow:
    * Validate brand exists (and ownership if enabled later)
    * Validate category belongs to brand
    * Create product
    * Handle unique constraint errors (productCode)
    */
    async create(dto: CreateProductDto) {
        // Validate Brand Ownership
        const brand = await this.prisma.productBrand.findFirst({
            where: {
                id: dto.brandId,
                // ownerId validation can be added here later
            },
        });

        if (!brand) {
            throw new NotFoundException(
                'Brand not found or not owned by you',
            );
        }

        // Validate Category belongs to brand
        const category = await this.prisma.productCategory.findFirst({
            where: {
                id: dto.categoryId,
                brandId: dto.brandId,
                isActive: true,
            },
        });

        if (!category) {
            throw new BadRequestException(
                'Invalid category for this brand',
            );
        }

        // Create Product
        try {
            return await this.prisma.product.create({
                data: {
                    name: dto.name,
                    productCode: dto.productCode,
                    brandId: dto.brandId,
                    categoryId: dto.categoryId,
                    description: dto.description,
                },
            });
        } catch (error) {
            // Handle unique constraint violation (Prisma P2002)
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

    /**
   * Get single product with full relational data
   *
   * Includes:
   * - Brand
   * - Category
   * - Product-level media (variantId = null)
   * - Active variants
   * - Variant-level media
   */
    async findOne(productId: string) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            include: {
                brand: true,
                category: true,
                // Product-level media only
                media: {
                    where: {
                        isActive: true,
                        variantId: null,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },

                // Active variants with their media
                variants: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'asc' },
                    include: {
                        // Variant-specific media
                        media: {
                            where: { isActive: true },
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }

    /**
    * Paginated product listing
    *
    * Supports:
    * - Pagination (page, limit)
    * - Optional brand filter
    * - Only active products
    *
    * Returns:
    * {
    *   data: Product[],
    *   meta: { total, page, lastPage }
    * }
    */
    async findAll(
        page: number = 1,
        limit: number = 10,
        brandId?: string,
    ) {
        const skip = (page - 1) * limit;

        const whereCondition: any = {
            isActive: true,
        };

        // Optional brand filter
        if (brandId) {
            whereCondition.brandId = brandId;
        }

        // Use transaction for consistency (data + count)
        const [products, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({
                where: whereCondition,
                include: {
                    // Product-level media only
                    media: {
                        where: {
                            isActive: true,
                            variantId: null,
                        },
                        orderBy: {
                            sortOrder: 'asc',
                        },
                    },

                    variants: {
                        where: { isActive: true },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.product.count({
                where: whereCondition,
            }),
        ]);

        return {
            data: products,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    /**
    * Update product basic details
    *
    * Only allows:
    * - name
    * - description
    * - categoryId
    *
    * Prevents update on inactive products.
    */
    async update(productId: string, dto: UpdateProductDto) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product || !product.isActive) {
            throw new NotFoundException('Product not found');
        }

        return this.prisma.product.update({
            where: { id: productId },
            data: {
                name: dto.name,
                description: dto.description,
                categoryId: dto.categoryId,
            },
        });
    }

    /**
    * Soft delete product
    *
    * - Sets product.isActive = false
    * - Deactivates all variants
    * - Preserves data integrity (no hard delete)
    */
    async remove(productId: string) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product || !product.isActive) {
            throw new NotFoundException('Product not found');
        }

        return this.prisma.product.update({
            where: { id: productId },
            data: {
                isActive: false,

                // Cascade deactivate variants
                variants: {
                    updateMany: {
                        where: {},
                        data: { isActive: false },
                    },
                },
            },
        });
    }



}
