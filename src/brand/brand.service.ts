import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateBrandDto, userId: string) {
        return this.prisma.productBrand.create({
            data: {
                name: data.name,
                ownerId: userId,
            },
        });
    }

    async findMyBrands(userId: string) {
        return this.prisma.productBrand.findMany({
            where: { ownerId: userId },
        });
    }

    async findOne(id: string, userId: string) {
        const brand = await this.prisma.productBrand.findFirst({
            where: {
                id,
                ownerId: userId,
            },
        });

        if (!brand) {
            throw new NotFoundException('Brand not found');
        }

        return brand;
    }

    async update(id: string, data: UpdateBrandDto, userId: string) {
        await this.findOne(id, userId); // ownership check

        return this.prisma.productBrand.update({
            where: { id },
            data,
        });
    }

    async remove(id: string, userId: string) {
        await this.findOne(id, userId); // ownership check

        return this.prisma.productBrand.delete({
            where: { id },
        });
    }

    async findAll() {
        return this.prisma.productBrand.findMany();
    }


}
