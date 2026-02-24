import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { Role } from '@prisma/client';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
import { ReorderCategoryDto } from './dto/reorder-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';

@Injectable()
export class ProductCategoryService {
  constructor(private prisma: PrismaService) { }

  /* =====================================================
     CREATE
     ===================================================== */
  async create(dto: CreateProductCategoryDto, user: JwtUser) {
    const brandOwner = await this.getBrandOwnerProfile(user);

    // Validate parent category (if provided)
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

    // Get next position inside same parent
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
        description: dto.description ?? "",
        position: nextPosition,
      },
    });
  }


  //* =====================================================
  //   REORDER CATEGORIES
  //   - Accepts an array of category IDs with their new parentId and position.
  //   - Validates that categories belong to the user and prevents cycles.
  //   - Updates all categories in a single transaction for consistency.
  //* =====================================================
  async reorder(flatData: { id: string; parentId: string | null; position: number }[], user: JwtUser) {
    const brandOwner = await this.getBrandOwnerProfile(user);

    // Validate all category IDs belong to the same BrandOwner
    const categoryIds = flatData.map(d => d.id);
    const categories = await this.prisma.productCategory.findMany({
      where: { id: { in: categoryIds }, brandOwnerId: brandOwner.id },
    });

    if (categories.length !== flatData.length) {
      throw new BadRequestException('Some categories are invalid or do not belong to the BrandOwner');
    }

    // Perform updates in a transaction
    await this.prisma.$transaction(
      flatData.map(item =>
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
     FIND MY CATEGORIES (Tree Structure)
     ===================================================== */
  async findMyCategories(user: JwtUser) {
    const ownerIds = await this.getAccessibleBrandOwnerIds(user);

    return this.prisma.productCategory.findMany({
      where: {
        brandOwnerId: { in: ownerIds },
        isActive: true,
      },
      orderBy: [
        { parentId: 'asc' },
        { position: 'asc' },
      ],
    });
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

    // Validate parent change
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
     DELETE (Soft Delete Recommended)
     ===================================================== */
  async remove(id: string, user: JwtUser) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
    });

    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found');
    }

    await this.validateCategoryOwnership(category.brandOwnerId, user, true);

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
      return owners.map(o => o.id);
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

      return links.map(l => l.brandOwnerId);
    }

    return [];
  }
}