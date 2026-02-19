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

    private calculateGross(net: number, taxRate: number): number {
        return Number((net + (net * taxRate) / 100).toFixed(2));
    }

    async create(
        productId: string,
        dto: CreateProductVariantDto,
    ) {
        // 1️⃣ Ensure product exists
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // 2️⃣ Generate SKU (or use override)
        const sku =
            dto.sku ??
            this.generateSku(product.productCode, dto.size, dto.color);

        // 3️⃣ Prevent duplicate SKU
        const existing = await this.prisma.productVariant.findUnique({
            where: { sku },
        });

        if (existing) {
            throw new BadRequestException('SKU already exists');
        }

        // 4️⃣ Calculate gross prices
        const wholesaleGross = this.calculateGross(
            dto.wholesaleNet,
            dto.taxRate,
        );

        const retailGross = this.calculateGross(
            dto.retailNet,
            dto.taxRate,
        );

        // 5️⃣ Create variant
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
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new BadRequestException('SKU already exists');
            }

            throw error;
        }

    }

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


}
