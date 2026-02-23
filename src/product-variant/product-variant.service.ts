/**
 * ---------------------------------------------------------
 * PRODUCT VARIANT SERVICE
 * ---------------------------------------------------------
 * Primary Responsibilities:
 *
 * 1. Create product variants under a product
 * 2. Auto-generate SKU based on productCode + attributes
 * 3. Prevent duplicate SKU globally
 * 4. Calculate gross prices from net + tax rate
 * 5. Update financial & stock information
 * 6. Soft delete variants (isActive flag)
 *
 * Business Rules:
 * - Variant must belong to an existing product
 * - SKU must be unique
 * - Gross prices are always derived from net + tax
 * - Financial calculations are centralized here
 * - No hard deletes (soft delete only)
 *
 * Designed for scalable multi-variant e-commerce systems.
 * ---------------------------------------------------------
 */

import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { Prisma } from '@prisma/client';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Injectable()
export class ProductVariantService {
    constructor(private prisma: PrismaService) { }

    /**
   * Generate SKU automatically based on:
   * - productCode
   * - size (optional)
   * - color (optional)
   *
   * Example:
   * PROD123-M-BLACK
   * PROD123-DEFAULT
   */
    private generateSku(
        productCode: string,
        size?: string,
        color?: string,
    ): string {
        const parts = [
            productCode,
            size?.toUpperCase(),
            color?.toUpperCase(),
        ].filter(Boolean);

        return parts.length > 1
            ? parts.join('-')
            : `${productCode}-DEFAULT`;
    }

    /**
   * Calculate gross price from:
   * net + taxRate (%)
   *
   * Ensures 2 decimal precision.
   */
    private calculateGross(net: number, taxRate: number): number {
        return Number((net + (net * taxRate) / 100).toFixed(2));
    }

    /**
   * Create new product variant
   *
   * Flow:
   * Validate product exists
   * Generate or accept SKU
   * Prevent duplicate SKU
   * Calculate gross prices
   * Create variant
   */
    async create(
        productId: string,
        dto: CreateProductVariantDto,
    ) {
        // Ensure product exists
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Generate SKU (if not manually provided)
        const sku =
            dto.sku ??
            this.generateSku(product.productCode, dto.size, dto.color);

        // Prevent duplicate SKU globally
        const existing = await this.prisma.productVariant.findUnique({
            where: { sku },
        });

        if (existing) {
            throw new BadRequestException('SKU already exists');
        }

        // Calculate gross prices
        const wholesaleGross = this.calculateGross(
            dto.wholesaleNet,
            dto.taxRate,
        );

        const retailGross = this.calculateGross(
            dto.retailNet,
            dto.taxRate,
        );

        // Create variant
        try {
            return await this.prisma.productVariant.create({
                data: {
                    productId,
                    sku,
                    size: dto.size,
                    color: dto.color,
                    taxRate: dto.taxRate,
                    costPrice: dto.costPrice,
                    wholesaleNet: dto.wholesaleNet,
                    wholesaleGross,
                    retailNet: dto.retailNet,
                    retailGross,
                    stock: dto.stock,
                },
            });
        } catch (error) {
            // Handle unique constraint (Prisma P2002)
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new BadRequestException('SKU already exists');
            }

            throw error;
        }

    }

    /**
   * Update variant financials & stock
   *
   * Rules:
   * - Recalculate gross values if net or tax changes
   * - Prevent updates on inactive variants
   */
    async update(
        variantId: string,
        dto: UpdateProductVariantDto,
    ) {
        const variant = await this.prisma.productVariant.findUnique({
            where: { id: variantId },
        });

        if (!variant || !variant.isActive) {
            throw new NotFoundException('Variant not found');
        }

        const taxRate = dto.taxRate ?? variant.taxRate;
        const wholesaleNet = dto.wholesaleNet ?? variant.wholesaleNet;
        const retailNet = dto.retailNet ?? variant.retailNet;

        const wholesaleGross =
            wholesaleNet + (wholesaleNet * taxRate) / 100;

        const retailGross =
            retailNet + (retailNet * taxRate) / 100;

        return this.prisma.productVariant.update({
            where: { id: variantId },
            data: {
                taxRate,
                costPrice: dto.costPrice,
                wholesaleNet,
                wholesaleGross,
                retailNet,
                retailGross,
                stock: dto.stock,
            },
        });
    }

    /**
   * Soft delete variant
   *
   * - Sets isActive = false
   * - Keeps historical data intact
   */
    async remove(variantId: string) {
        const variant = await this.prisma.productVariant.findUnique({
            where: { id: variantId },
        });

        if (!variant || !variant.isActive) {
            throw new NotFoundException('Variant not found');
        }

        return this.prisma.productVariant.update({
            where: { id: variantId },
            data: { isActive: false },
        });
    }

    async findAll(productId: string, user: any) {
        await this.validateBrandOwnership(productId, user);

        return this.prisma.productVariant.findMany({
            where: {
                productId,
                isActive: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async getSummary(productId: string, user: any) {
        await this.validateBrandOwnership(productId, user);

        const variants = await this.prisma.productVariant.findMany({
            where: {
                productId,
                isActive: true,
            },
            select: {
                stock: true,
                retailGross: true,
            },
        });

        const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

        const prices = variants.map(v => v.retailGross);

        const minPrice = prices.length ? Math.min(...prices) : 0;
        const maxPrice = prices.length ? Math.max(...prices) : 0;

        return {
            totalVariants: variants.length,
            totalStock,
            priceRange: {
                min: minPrice,
                max: maxPrice,
            },
        };
    }

    async adjustStock(variantId: string, quantity: number) {
        const variant = await this.prisma.productVariant.findUnique({
            where: { id: variantId },
        });

        if (!variant || !variant.isActive) {
            throw new NotFoundException('Variant not found');
        }

        if (variant.stock + quantity < 0) {
            throw new BadRequestException('Insufficient stock');
        }

        return this.prisma.productVariant.update({
            where: { id: variantId },
            data: {
                stock: {
                    increment: quantity,
                },
            },
        });
    }

    private async validateBrandOwnership(productId: string, user: any) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            select: {
                brandOwner: {
                    select: {
                        userId: true,
                    },
                },
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
            return;
        }

        if (
            user.role === 'BRAND_OWNER' &&
            product.brandOwner.userId === user.sub
        ) {
            return;
        }

        throw new BadRequestException('Access denied');
    }

}
