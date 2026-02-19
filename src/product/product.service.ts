/**
 * Product Service :  Handles all business logic related to Products.
 * -----------------------------------------------------
 * Responsibilities:
 * - Create and update products
 * - Fetch products with related media and variants
 * - Ensure relational integrity with category and brand
 *
 * NOTE:
 * Media primary logic is handled inside MediaService.
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

    //async create(dto: CreateProductDto, ownerId: string)
    async create(dto: CreateProductDto) {
        // 1️⃣ Validate Brand Ownership
        const brand = await this.prisma.productBrand.findFirst({
            where: {
                id: dto.brandId,
                //ownerId, // For now, skip owner validation
            },
        });

        if (!brand) {
            throw new NotFoundException(
                'Brand not found or not owned by you',
            );
        }

        // 2️⃣ Validate Category belongs to brand
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

        // 3️⃣ Create Product
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

    async findOne(productId: string) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            include: {
                brand: true,
                category: true,
                // ✅ Product-level images
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
                    orderBy: { createdAt: 'asc' },
                    include: {
                        // ✅ Variant-specific images
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

    async findAll(
        page: number = 1,
        limit: number = 10,
        brandId?: string,
    ) {
        const skip = (page - 1) * limit;

        const whereCondition: any = {
            isActive: true,
        };

        if (brandId) {
            whereCondition.brandId = brandId;
        }

        const [products, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({
                where: whereCondition,
                include: {
                    // ✅ Only product-level images
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
