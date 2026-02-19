/**
 * ---------------------------------------------------------
 * PRODUCT CATEGORY SERVICE
 * ---------------------------------------------------------
 * Primary Responsibilities:
 * 
 * 1. Create product categories under a specific brand
 * 2. Validate brand existence before category creation
 * 3. Support hierarchical categories (parent → child)
 * 4. Ensure parent category belongs to same brand
 * 5. Fetch active root categories with active children
 * 6. Maintain clean brand-based category isolation
 *
 * Business Rules Enforced:
 * - Category cannot exist without a valid brand
 * - Parent category must belong to the same brand
 * - Only active categories are returned in listings
 *
 * This service ensures brand-level category integrity
 * and hierarchical consistency.
 * ---------------------------------------------------------
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';

@Injectable()
export class ProductCategoryService {
  constructor(private prisma: PrismaService) { }

  /**
   * Create a new Product Category
   * 
   * Flow:
   * Validate Brand exists
   * If parentId is provided → validate parent category
   * Ensure parent belongs to same brand
   * Create category
   */
  async create(dto: CreateProductCategoryDto) {

    // Validate Brand Exists
    const brand = await this.prisma.productBrand.findUnique({
      where: { id: dto.brandId },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    // If parentId provided, validate it
    if (dto.parentId) {

      const parent = await this.prisma.productCategory.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }

      // Business Rule:
      // Parent category must belong to same brand
      if (parent.brandId !== dto.brandId) {
        throw new BadRequestException(
          'Parent category must belong to same brand',
        );
      }
    }

    // Create Category
    return this.prisma.productCategory.create({
      data: {
        name: dto.name,
        brandId: dto.brandId,
        parentId: dto.parentId, // Optional (for hierarchy)
      },
    });
  }

  /**
   * Fetch Active Categories By Brand
   *
   * Returns:
   * - Only ROOT categories (parentId = null)
   * - Only active categories
   * - Includes active children
   * - Ordered by creation date
   */
  async findByBrand(brandId: string) {

    // Validate brand exists
    const brand = await this.prisma.productBrand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return this.prisma.productCategory.findMany({
      where: {
        brandId,
        parentId: null,   // Only root categories
        isActive: true,
      },
      include: {
        children: {
          where: { isActive: true }, // Only active subcategories
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
