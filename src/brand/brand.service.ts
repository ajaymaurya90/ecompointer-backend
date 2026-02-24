import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Role } from '@prisma/client';
import type { JwtUser } from '../auth/types/jwt-user.type';

@Injectable()
export class BrandService {
    constructor(private prisma: PrismaService) { }

    /*
     =============================
     CREATE
     =============================
    */
    async create(dto: CreateBrandDto, user: JwtUser) {
        const brandOwner = await this.getBrandOwnerProfile(user.id);

        return this.prisma.productBrand.create({
            data: {
                name: dto.name,
                ownerId: brandOwner.id,
            },
        });
    }

    /*
     =============================
     FIND MANY
     =============================
    */
    async findBrands(user: JwtUser) {
        if (user.role === Role.SUPER_ADMIN) {
            return this.prisma.productBrand.findMany();
        }

        if (user.role === Role.BRAND_OWNER) {
            const brandOwner = await this.getBrandOwnerProfile(user.id);

            return this.prisma.productBrand.findMany({
                where: { ownerId: brandOwner.id },
            });
        }

        if (user.role === Role.SHOP_OWNER) {
            throw new ForbiddenException(
                'ShopOwner brand visibility not implemented yet',
            );
        }

        throw new ForbiddenException('Access denied');
    }

    /*
     =============================
     FIND ONE
     =============================
    */
    async findOne(id: string, user: JwtUser) {
        const brand = await this.prisma.productBrand.findUnique({
            where: { id },
        });

        if (!brand) {
            throw new NotFoundException('Brand not found');
        }

        // SuperAdmin can access any brand
        if (user.role === Role.SUPER_ADMIN) {
            return brand;
        }

        // BrandOwner must own it
        if (user.role === Role.BRAND_OWNER) {
            const brandOwner = await this.getBrandOwnerProfile(user.id);

            if (brand.ownerId !== brandOwner.id) {
                throw new ForbiddenException('Not your brand');
            }

            return brand;
        }

        throw new ForbiddenException('Access denied');
    }

    /*
     =============================
     UPDATE
     =============================
    */
    async update(id: string, dto: UpdateBrandDto, user: JwtUser) {
        const brand = await this.findOne(id, user); // ownership validated

        return this.prisma.productBrand.update({
            where: { id: brand.id },
            data: dto,
        });
    }

    /*
     =============================
     DELETE
     =============================
    */
    async remove(id: string, user: JwtUser) {
        const brand = await this.findOne(id, user); // ownership validated

        const productCount = await this.prisma.product.count({
            where: { brandId: brand.id },
        });

        if (productCount > 0) {
            throw new ForbiddenException(
                "Cannot delete brand with existing products"
            );
        }
        return this.prisma.productBrand.delete({
            where: { id: brand.id },
        });
    }

    /*
     =============================
     PRIVATE HELPER
     =============================
    */
    private async getBrandOwnerProfile(userId: string) {
        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { userId },
        });

        if (!brandOwner) {
            throw new ForbiddenException('BrandOwner profile not found');
        }

        return brandOwner;
    }
}