import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductCategoryDto } from '../dto/create-product-category.dto';
import { UpdateProductCategoryDto } from '../dto/update-product-category.dto';
import { Role } from '@prisma/client';
import type { JwtUser } from 'src/auth/types/jwt-user.type';

@Injectable()
export class ProductCategoryService {
  constructor(private prisma: PrismaService) { }

  /* =====================================================
     CREATE
     ===================================================== */
  async create(dto: CreateProductCategoryDto, user: JwtUser) {
    const brandOwner = await this.getBrandOwnerProfile(user);

    // Validate parent category when creating subcategory.
    if (dto.parentId) {
      const parent = await this.prisma.productCategory.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent || !parent.isActive) {
        throw new BadRequestException('Parent category not found');
      }

      if (parent.brandOwnerId !== brandOwner.id) {
        throw new BadRequestException(
          'Parent category must belong to same BrandOwner',
        );
      }
    }

    // Get next sibling position inside same parent bucket.
    const lastSibling = await this.prisma.productCategory.findFirst({
      where: {
        brandOwnerId: brandOwner.id,
        parentId: dto.parentId ?? null,
      },
      orderBy: { position: 'desc' },
    });

    const nextPosition = lastSibling ? lastSibling.position + 1 : 1;

    return this.prisma.productCategory.create({
      data: {
        name: dto.name,
        parentId: dto.parentId ?? null,
        brandOwnerId: brandOwner.id,
        description: dto.description ?? '',
        position: nextPosition,
      },
    });
  }

  /* =====================================================
     REORDER CATEGORIES
     ===================================================== */
  async reorder(
    flatData: { id: string; parentId: string | null; position: number }[],
    user: JwtUser,
  ) {
    const brandOwner = await this.getBrandOwnerProfile(user);

    // Validate all categories belong to same BrandOwner before reorder.
    const categoryIds = flatData.map((item) => item.id);

    const categories = await this.prisma.productCategory.findMany({
      where: {
        id: { in: categoryIds },
        brandOwnerId: brandOwner.id,
      },
    });

    if (categories.length !== flatData.length) {
      throw new BadRequestException(
        'Some categories are invalid or do not belong to the BrandOwner',
      );
    }

    // Persist all reorder operations atomically.
    await this.prisma.$transaction(
      flatData.map((item) =>
        this.prisma.productCategory.update({
          where: { id: item.id },
          data: {
            parentId: item.parentId ?? null,
            position: item.position,
          },
        }),
      ),
    );

    return { success: true };
  }

  /* =====================================================
     FIND MY CATEGORIES
     ===================================================== */
  async findMyCategories(user: JwtUser) {
    const ownerIds = await this.getAccessibleBrandOwnerIds(user);

    // Count assigned active products through join table.
    const categories = await this.prisma.productCategory.findMany({
      where: {
        brandOwnerId: { in: ownerIds },
        isActive: true,
      },
      orderBy: [{ parentId: 'asc' }, { position: 'asc' }],
      select: {
        id: true,
        name: true,
        parentId: true,
        description: true,
        position: true,
        isActive: true,
        productAssignments: {
          where: {
            product: {
              isActive: true,
            },
          },
          select: {
            productId: true,
          },
        },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      parentId: category.parentId,
      description: category.description,
      position: category.position,
      isActive: category.isActive,
      _count: {
        products: category.productAssignments.length,
      },
    }));
  }

  /* =====================================================
     FIND CATEGORY PRODUCTS
     ===================================================== */
  async findCategoryProducts(
    categoryId: string,
    user: JwtUser,
    page = 1,
    limit = 10,
  ) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        brandOwnerId: true,
        isActive: true,
      },
    });

    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found');
    }

    await this.validateCategoryOwnership(category.brandOwnerId, user, false);

    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (safePage - 1) * safeLimit;

    // Count total active assignments first for pagination.
    const total = await this.prisma.productCategoryAssignment.count({
      where: {
        categoryId: category.id,
        product: {
          isActive: true,
        },
      },
    });

    // Load active products assigned through join table with pagination.
    const assignments = await this.prisma.productCategoryAssignment.findMany({
      where: {
        categoryId: category.id,
        product: {
          isActive: true,
        },
      },
      skip,
      take: safeLimit,
      orderBy: {
        product: {
          name: 'asc',
        },
      },
      select: {
        product: {
          select: {
            id: true,
            name: true,
            productCode: true,
            description: true,
            brand: {
              select: {
                id: true,
                name: true,
              },
            },
            variants: {
              where: { isActive: true },
              select: {
                stock: true,
              },
            },
          },
        },
      },
    });

    const data = assignments.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      productCode: item.product.productCode,
      description: item.product.description,
      brand: item.product.brand,
      totalStock: item.product.variants.reduce(
        (sum, variant) => sum + variant.stock,
        0,
      ),
      variantCount: item.product.variants.length,
    }));

    return {
      category: {
        id: category.id,
        name: category.name,
      },
      data,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  /* =====================================================
     FIND ASSIGNABLE PRODUCTS
     ===================================================== */
  async findAssignableProducts(
    categoryId: string,
    user: JwtUser,
    search?: string,
  ) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        brandOwnerId: true,
        isActive: true,
      },
    });

    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found');
    }

    await this.validateCategoryOwnership(category.brandOwnerId, user, false);

    const trimmedSearch = search?.trim();

    // Search products for multiselect assignment UI. No pagination by design.
    const products = await this.prisma.product.findMany({
      where: {
        brandOwnerId: category.brandOwnerId,
        isActive: true,
        ...(trimmedSearch
          ? {
            OR: [
              {
                name: {
                  contains: trimmedSearch,
                  mode: 'insensitive' as const,
                },
              },
              {
                productCode: {
                  contains: trimmedSearch,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
          : {}),
      },
      take: 100,
      orderBy: [{ name: 'asc' }],
      select: {
        id: true,
        name: true,
        productCode: true,
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        categoryAssignments: {
          select: {
            categoryId: true,
          },
        },
      },
    });

    const data = products
      .map((product) => {
        const assignedCategoryIds = product.categoryAssignments.map(
          (item) => item.categoryId,
        );

        return {
          id: product.id,
          name: product.name,
          productCode: product.productCode,
          brand: product.brand,
          alreadyAssignedToThisCategory: assignedCategoryIds.includes(
            category.id,
          ),
        };
      })
      // Do not return products already assigned to the selected category.
      .filter((product) => !product.alreadyAssignedToThisCategory);

    return {
      category: {
        id: category.id,
        name: category.name,
      },
      data,
    };
  }

  /* =====================================================
     ASSIGN PRODUCTS TO CATEGORY
     ===================================================== */
  async assignProductsToCategory(
    categoryId: string,
    productIds: string[],
    user: JwtUser,
  ) {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new BadRequestException('productIds are required');
    }

    const uniqueProductIds = [...new Set(productIds)];

    const category = await this.prisma.productCategory.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        brandOwnerId: true,
        isActive: true,
      },
    });

    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found');
    }

    await this.validateCategoryOwnership(category.brandOwnerId, user, true);

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: uniqueProductIds },
        brandOwnerId: category.brandOwnerId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (products.length !== uniqueProductIds.length) {
      throw new BadRequestException(
        'Some selected products are invalid for this BrandOwner',
      );
    }

    // Create missing join rows only. Do not touch other category assignments.
    await this.prisma.productCategoryAssignment.createMany({
      data: uniqueProductIds.map((productId) => ({
        productId,
        categoryId: category.id,
      })),
      skipDuplicates: true,
    });

    return {
      message: 'Products assigned to category successfully',
      category: {
        id: category.id,
        name: category.name,
      },
      assignedCount: uniqueProductIds.length,
    };
  }

  /* =====================================================
     REMOVE PRODUCT ASSIGNMENT FROM CATEGORY
     ===================================================== */
  async removeProductAssignment(
    categoryId: string,
    productId: string,
    user: JwtUser,
  ) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        brandOwnerId: true,
        isActive: true,
      },
    });

    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found');
    }

    await this.validateCategoryOwnership(category.brandOwnerId, user, true);

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        brandOwnerId: category.brandOwnerId,
        isActive: true,
      },
      select: {
        id: true,
        categoryId: true,
        categoryAssignments: {
          select: {
            categoryId: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const assignmentCount = product.categoryAssignments.length;
    const isPrimaryCategory = product.categoryId === categoryId;

    // Prevent removing the last category assignment.
    if (assignmentCount <= 1) {
      throw new BadRequestException(
        'Cannot remove the last category assignment from a product',
      );
    }

    // Prevent removing current primary category from category page.
    if (isPrimaryCategory) {
      throw new BadRequestException(
        'Cannot remove the primary category assignment from category page. Please change the primary category from product edit page first.',
      );
    }

    await this.prisma.productCategoryAssignment.deleteMany({
      where: {
        productId,
        categoryId,
      },
    });

    return {
      message: 'Product assignment removed successfully',
    };
  }

  /* =====================================================
     UPDATE
     ===================================================== */
  async update(id: string, dto: UpdateProductCategoryDto, user: JwtUser) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
    });

    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found');
    }

    await this.validateCategoryOwnership(category.brandOwnerId, user, true);

    // Validate parent change.
    if (dto.parentId) {
      const parent = await this.prisma.productCategory.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent || !parent.isActive) {
        throw new BadRequestException('Parent category not found');
      }

      if (parent.brandOwnerId !== category.brandOwnerId) {
        throw new BadRequestException(
          'Parent category must belong to same BrandOwner',
        );
      }
    }

    return this.prisma.productCategory.update({
      where: { id },
      data: dto,
    });
  }

  /* =====================================================
     DELETE
     ===================================================== */
  async remove(id: string, user: JwtUser) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
    });

    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found');
    }

    await this.validateCategoryOwnership(category.brandOwnerId, user, true);

    const childCount = await this.prisma.productCategory.count({
      where: {
        parentId: id,
        isActive: true,
      },
    });

    if (childCount > 0) {
      throw new BadRequestException(
        'Cannot delete category if it has subcategories',
      );
    }

    // Block delete when any active product assignment exists.
    const assignmentCount = await this.prisma.productCategoryAssignment.count({
      where: {
        categoryId: id,
        product: {
          isActive: true,
        },
      },
    });

    if (assignmentCount > 0) {
      throw new BadRequestException(
        'Cannot delete category if it has mapped products',
      );
    }

    return this.prisma.productCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /* =====================================================
     ACCESS HELPERS
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

  private async validateCategoryOwnership(
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

  private async getAccessibleBrandOwnerIds(user: JwtUser): Promise<string[]> {
    if (user.role === Role.SUPER_ADMIN) {
      const owners = await this.prisma.brandOwner.findMany({
        select: { id: true },
      });

      return owners.map((owner) => owner.id);
    }

    if (user.role === Role.BRAND_OWNER) {
      const brandOwner = await this.getBrandOwnerProfile(user);
      return [brandOwner.id];
    }

    if (user.role === Role.SHOP_OWNER) {
      const links = await this.prisma.brandOwnerShop.findMany({
        where: { shopOwnerId: user.id, isActive: true },
        select: { brandOwnerId: true },
      });

      return links.map((link) => link.brandOwnerId);
    }

    return [];
  }
}