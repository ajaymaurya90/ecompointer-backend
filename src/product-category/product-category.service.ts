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

    async create(dto: CreateProductCategoryDto) {
        // 1️⃣ Validate Brand Exists
        const brand = await this.prisma.productBrand.findUnique({
            where: { id: dto.brandId },
        });

        if (!brand) {
            throw new NotFoundException('Brand not found');
        }

        // 2️⃣ If parentId provided, validate it
        if (dto.parentId) {
            const parent = await this.prisma.productCategory.findUnique({
                where: { id: dto.parentId },
            });

            if (!parent) {
                throw new BadRequestException('Parent category not found');
            }

            if (parent.brandId !== dto.brandId) {
                throw new BadRequestException(
                    'Parent category must belong to same brand',
                );
            }
        }

        // 3️⃣ Create Category
        return this.prisma.productCategory.create({
            data: {
                name: dto.name,
                brandId: dto.brandId,
                parentId: dto.parentId,
            },
        });
    }

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
        where: { isActive: true },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

}
