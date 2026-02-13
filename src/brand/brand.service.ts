import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';

@Injectable()
export class BrandService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateBrandDto, userId: string) {
        return this.prisma.brand.create({
            data: {
                name: data.name,
                ownerId: userId,
            },
        });
    }

    async findMyBrands(userId: string) {
        return this.prisma.brand.findMany({
            where: { ownerId: userId },
        });
    }
}
