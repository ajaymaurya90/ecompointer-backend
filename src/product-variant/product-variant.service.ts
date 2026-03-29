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
 * 7. Enforce product ownership and access rules
 *
 * Business Rules:
 * - Variant must belong to an existing active product
 * - SKU must be unique
 * - Gross prices are derived from net + tax
 * - No hard deletes (soft delete only)
 * ---------------------------------------------------------
 */

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { Prisma, Role } from '@prisma/client';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
import { GenerateProductVariantsDto } from './dto/generate-product-variants.dto';

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
            size?.trim().toUpperCase(),
            color?.trim().toUpperCase(),
        ].filter(Boolean);

        return parts.length > 1
            ? parts.join('-')
            : `${productCode}-DEFAULT`;
    }

    private calculateGross(net: number, taxRate: number): number {
        return Number((net + (net * taxRate) / 100).toFixed(2));
    }

    private async getBrandOwnerProfile(userId: string) {
        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { userId },
        });

        if (!brandOwner) {
            throw new ForbiddenException('BrandOwner profile not found');
        }

        return brandOwner;
    }

    private async getAccessibleProduct(
        productId: string,
        user: JwtUser,
        requireOwnership: boolean,
    ) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            include: {
                brandOwner: true,
            },
        });

        if (!product || !product.isActive) {
            throw new NotFoundException('Product not found');
        }

        await this.validateProductAccess(product.brandOwnerId, user, requireOwnership);

        return product;
    }

    private async getAccessibleVariant(
        productId: string,
        variantId: string,
        user: JwtUser,
        requireOwnership: boolean,
    ) {
        const variant = await this.prisma.productVariant.findUnique({
            where: { id: variantId },
            include: {
                product: true,
            },
        });

        if (!variant || !variant.isActive) {
            throw new NotFoundException('Variant not found');
        }

        if (variant.productId !== productId) {
            throw new BadRequestException('Variant does not belong to this product');
        }

        await this.validateProductAccess(
            variant.product.brandOwnerId,
            user,
            requireOwnership,
        );

        return variant;
    }

    private async validateProductAccess(
        brandOwnerId: string,
        user: JwtUser,
        requireOwnership: boolean,
    ) {
        if (user.role === Role.SUPER_ADMIN) {
            return;
        }

        if (user.role === Role.BRAND_OWNER) {
            const brandOwner = await this.getBrandOwnerProfile(user.id);

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

    async create(
        productId: string,
        dto: CreateProductVariantDto,
        user: JwtUser,
    ) {
        const product = await this.getAccessibleProduct(productId, user, true);

        const sku =
            dto.sku?.trim() ||
            this.generateSku(product.productCode, dto.size, dto.color);

        const existing = await this.prisma.productVariant.findUnique({
            where: { sku },
        });

        if (existing) {
            throw new BadRequestException(`SKU "${sku}" already exists`);
        }

        const wholesaleGross = this.calculateGross(dto.wholesaleNet, dto.taxRate);
        const retailGross = this.calculateGross(dto.retailNet, dto.taxRate);

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
                    isActive: dto.isActive ?? true,
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new BadRequestException(`SKU "${sku}" already exists`);
            }

            throw error;
        }
    }

    async findAll(productId: string, user: JwtUser) {
        await this.getAccessibleProduct(productId, user, false);

        return this.prisma.productVariant.findMany({
            where: {
                productId,
                isActive: true,
            },
            orderBy: { createdAt: 'asc' },
            include: {
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
        });
    }

    async getSummary(productId: string, user: JwtUser) {
        await this.getAccessibleProduct(productId, user, false);

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

        const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
        const prices = variants.map((variant) => variant.retailGross);

        return {
            totalVariants: variants.length,
            totalStock,
            priceRange: {
                min: prices.length ? Math.min(...prices) : 0,
                max: prices.length ? Math.max(...prices) : 0,
            },
        };
    }

    async update(
        productId: string,
        variantId: string,
        dto: UpdateProductVariantDto,
        user: JwtUser,
    ) {
        const variant = await this.getAccessibleVariant(
            productId,
            variantId,
            user,
            true,
        );

        if (dto.sku !== undefined && !dto.sku.trim()) {
            throw new BadRequestException('SKU cannot be empty');
        }

        const taxRate = dto.taxRate ?? variant.taxRate;
        const wholesaleNet = dto.wholesaleNet ?? variant.wholesaleNet;
        const retailNet = dto.retailNet ?? variant.retailNet;

        const nextSku =
            dto.sku !== undefined
                ? dto.sku.trim()
                : variant.sku;

        const wholesaleGross = this.calculateGross(wholesaleNet, taxRate);
        const retailGross = this.calculateGross(retailNet, taxRate);

        try {
            return await this.prisma.productVariant.update({
                where: { id: variantId },
                data: {
                    sku: nextSku,
                    size: dto.size ?? variant.size,
                    color: dto.color ?? variant.color,
                    taxRate,
                    costPrice: dto.costPrice ?? variant.costPrice,
                    wholesaleNet,
                    wholesaleGross,
                    retailNet,
                    retailGross,
                    stock: dto.stock ?? variant.stock,
                    ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new BadRequestException(`SKU "${nextSku}" already exists`);
            }

            throw error;
        }
    }

    async remove(
        productId: string,
        variantId: string,
        user: JwtUser,
    ) {
        await this.getAccessibleVariant(productId, variantId, user, true);

        return this.prisma.productVariant.update({
            where: { id: variantId },
            data: { isActive: false },
        });
    }

    async adjustStock(
        productId: string,
        variantId: string,
        quantity: number,
        user: JwtUser,
    ) {
        const variant = await this.getAccessibleVariant(
            productId,
            variantId,
            user,
            true,
        );

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

    async generate(
        productId: string,
        dto: GenerateProductVariantsDto,
        user: JwtUser,
    ) {
        const product = await this.getAccessibleProduct(productId, user, true);

        const normalizedAttributes = dto.attributes
            .map((attribute, attributeIndex) => ({
                name: this.normalizeAttributeName(attribute.name),
                position: attributeIndex + 1,
                values: attribute.values
                    .map((value, valueIndex) => ({
                        value: this.normalizeAttributeValue(value),
                        position: valueIndex + 1,
                    }))
                    .filter((item) => item.value.length > 0),
            }))
            .filter(
                (attribute) =>
                    attribute.name.length > 0 && attribute.values.length > 0,
            );

        if (!normalizedAttributes.length) {
            throw new BadRequestException('At least one valid attribute is required');
        }

        const duplicateAttributeNames = new Set<string>();
        const seenNames = new Set<string>();

        for (const attribute of normalizedAttributes) {
            const lower = attribute.name.toLowerCase();
            if (seenNames.has(lower)) {
                duplicateAttributeNames.add(attribute.name);
            }
            seenNames.add(lower);
        }

        if (duplicateAttributeNames.size > 0) {
            throw new BadRequestException('Duplicate attribute names are not allowed');
        }

        const combinations = this.buildCombinations(
            normalizedAttributes.map((attribute) => ({
                name: attribute.name,
                values: attribute.values.map((value) => value.value),
            })),
        );

        return this.prisma.$transaction(async (tx) => {
            const attributeDefinitionMap = new Map<string, string>();
            const attributeValueMap = new Map<string, string>();

            for (const attribute of normalizedAttributes) {
                const definition = await tx.productAttribute.upsert({
                    where: {
                        productId_name: {
                            productId,
                            name: attribute.name,
                        },
                    },
                    update: {
                        position: attribute.position,
                    },
                    create: {
                        productId,
                        name: attribute.name,
                        position: attribute.position,
                    },
                });

                attributeDefinitionMap.set(attribute.name, definition.id);

                for (const value of attribute.values) {
                    const valueRecord = await tx.productAttributeValue.upsert({
                        where: {
                            attributeId_value: {
                                attributeId: definition.id,
                                value: value.value,
                            },
                        },
                        update: {
                            position: value.position,
                        },
                        create: {
                            attributeId: definition.id,
                            value: value.value,
                            position: value.position,
                        },
                    });

                    attributeValueMap.set(
                        `${attribute.name}::${value.value}`,
                        valueRecord.id,
                    );
                }
            }

            const created: any[] = [];
            const skipped: Array<{ sku: string; reason: string }> = [];

            for (const combination of combinations) {
                const sku = this.generateCombinationSku(
                    product.productCode,
                    combination,
                );

                const existingVariant = await tx.productVariant.findUnique({
                    where: { sku },
                });

                if (existingVariant) {
                    skipped.push({
                        sku,
                        reason: 'SKU already exists',
                    });
                    continue;
                }

                const sizeValue =
                    combination.find(
                        (item) => item.name.toLowerCase() === 'size',
                    )?.value ?? null;

                const colorValue =
                    combination.find(
                        (item) => item.name.toLowerCase() === 'color',
                    )?.value ?? null;

                const wholesaleGross = this.calculateGross(
                    dto.wholesaleNet,
                    dto.taxRate,
                );

                const retailGross = this.calculateGross(
                    dto.retailNet,
                    dto.taxRate,
                );

                const variant = await tx.productVariant.create({
                    data: {
                        productId,
                        sku,
                        size: sizeValue,
                        color: colorValue,
                        taxRate: dto.taxRate,
                        costPrice: dto.costPrice,
                        wholesaleNet: dto.wholesaleNet,
                        wholesaleGross,
                        retailNet: dto.retailNet,
                        retailGross,
                        stock: dto.stock,
                        isActive: dto.isActive ?? true,
                    },
                });

                for (const item of combination) {
                    const attributeValueId = attributeValueMap.get(
                        `${item.name}::${item.value}`,
                    );

                    if (!attributeValueId) {
                        throw new BadRequestException(
                            `Missing attribute value mapping for ${item.name}: ${item.value}`,
                        );
                    }

                    await tx.productVariantAttributeValue.create({
                        data: {
                            variantId: variant.id,
                            attributeValueId,
                        },
                    });
                }

                created.push(variant);
            }

            return {
                createdCount: created.length,
                skippedCount: skipped.length,
                created,
                skipped,
            };
        });
    }

    private normalizeAttributeName(name: string): string {
        return name.trim();
    }

    private normalizeAttributeValue(value: string): string {
        return value.trim();
    }

    private buildCombinations(
        attributes: { name: string; values: string[] }[],
        index = 0,
        current: { name: string; value: string }[] = [],
    ): { name: string; value: string }[][] {
        if (index === attributes.length) {
            return [current];
        }

        const attribute = attributes[index];
        const combinations: { name: string; value: string }[][] = [];

        for (const value of attribute.values) {
            combinations.push(
                ...this.buildCombinations(attributes, index + 1, [
                    ...current,
                    { name: attribute.name, value },
                ]),
            );
        }

        return combinations;
    }

    private generateCombinationSku(
        productCode: string,
        combination: { name: string; value: string }[],
    ): string {
        const suffix = combination
            .map((item) => item.value.trim().toUpperCase().replace(/\s+/g, '-'))
            .join('-');

        return `${productCode}-${suffix}`;
    }
}