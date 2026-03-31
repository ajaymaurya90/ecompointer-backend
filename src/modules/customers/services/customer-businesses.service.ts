import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { BusinessType, CustomerType, Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import type { JwtUser } from 'src/auth/types/jwt-user.type';

import { CreateCustomerBusinessDto } from '../dto/business/create-customer-business.dto';
import { UpdateCustomerBusinessDto } from '../dto/business/update-customer-business.dto';

@Injectable()
export class CustomerBusinessesService {
    constructor(private prisma: PrismaService) { }

    /* =====================================================
       CREATE CUSTOMER BUSINESS
       ===================================================== */
    async create(customerId: string, dto: CreateCustomerBusinessDto, user: JwtUser) {
        const customer = await this.getOwnedCustomer(customerId, user);

        if (dto.shopOwnerId) {
            await this.validateShopOwnerLink(customer.brandOwnerId, dto.shopOwnerId);
        }

        if (dto.isPrimary) {
            await this.unsetPrimaryBusinesses(customerId);
        }

        const business = await this.prisma.customerBusiness.create({
            data: {
                customerId: customer.id,
                shopOwnerId: dto.shopOwnerId,
                businessName: dto.businessName.trim(),
                legalBusinessName: dto.legalBusinessName?.trim(),
                businessType: dto.businessType ?? BusinessType.OTHER,
                contactPersonName: dto.contactPersonName?.trim(),
                contactPersonPhone: dto.contactPersonPhone?.trim(),
                contactPersonEmail: dto.contactPersonEmail?.trim().toLowerCase(),
                gstNumber: dto.gstNumber?.trim(),
                taxId: dto.taxId?.trim(),
                registrationNumber: dto.registrationNumber?.trim(),
                website: dto.website?.trim(),
                isPrimary: dto.isPrimary ?? false,
                notes: dto.notes?.trim(),
            },
            include: {
                shopOwner: {
                    select: {
                        id: true,
                        shopName: true,
                        ownerName: true,
                        shopSlug: true,
                    },
                },
            },
        });

        await this.syncCustomerTypeByBusinesses(customer.id);

        return business;
    }

    /* =====================================================
       UPDATE CUSTOMER BUSINESS
       ===================================================== */
    async update(
        customerId: string,
        businessId: string,
        dto: UpdateCustomerBusinessDto,
        user: JwtUser,
    ) {
        const customer = await this.getOwnedCustomer(customerId, user);

        const business = await this.prisma.customerBusiness.findFirst({
            where: {
                id: businessId,
                customerId: customer.id,
                isActive: true,
            },
        });

        if (!business) {
            throw new NotFoundException('Customer business not found');
        }

        if (dto.shopOwnerId) {
            await this.validateShopOwnerLink(customer.brandOwnerId, dto.shopOwnerId);
        }

        if (dto.isPrimary === true) {
            await this.unsetPrimaryBusinesses(customer.id, business.id);
        }

        const updatedBusiness = await this.prisma.customerBusiness.update({
            where: { id: business.id },
            data: {
                ...(dto.businessName !== undefined ? { businessName: dto.businessName.trim() } : {}),
                ...(dto.legalBusinessName !== undefined
                    ? { legalBusinessName: dto.legalBusinessName?.trim() || null }
                    : {}),
                ...(dto.businessType !== undefined ? { businessType: dto.businessType } : {}),
                ...(dto.shopOwnerId !== undefined ? { shopOwnerId: dto.shopOwnerId || null } : {}),
                ...(dto.contactPersonName !== undefined
                    ? { contactPersonName: dto.contactPersonName?.trim() || null }
                    : {}),
                ...(dto.contactPersonPhone !== undefined
                    ? { contactPersonPhone: dto.contactPersonPhone?.trim() || null }
                    : {}),
                ...(dto.contactPersonEmail !== undefined
                    ? { contactPersonEmail: dto.contactPersonEmail?.trim().toLowerCase() || null }
                    : {}),
                ...(dto.gstNumber !== undefined ? { gstNumber: dto.gstNumber?.trim() || null } : {}),
                ...(dto.taxId !== undefined ? { taxId: dto.taxId?.trim() || null } : {}),
                ...(dto.registrationNumber !== undefined
                    ? { registrationNumber: dto.registrationNumber?.trim() || null }
                    : {}),
                ...(dto.website !== undefined ? { website: dto.website?.trim() || null } : {}),
                ...(dto.isPrimary !== undefined ? { isPrimary: dto.isPrimary } : {}),
                ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
            },
            include: {
                shopOwner: {
                    select: {
                        id: true,
                        shopName: true,
                        ownerName: true,
                        shopSlug: true,
                    },
                },
            },
        });

        await this.syncCustomerTypeByBusinesses(customer.id);

        return updatedBusiness;
    }

    /* =====================================================
       REMOVE CUSTOMER BUSINESS (SOFT)
       ===================================================== */
    async remove(customerId: string, businessId: string, user: JwtUser) {
        const customer = await this.getOwnedCustomer(customerId, user);

        const business = await this.prisma.customerBusiness.findFirst({
            where: {
                id: businessId,
                customerId: customer.id,
                isActive: true,
            },
        });

        if (!business) {
            throw new NotFoundException('Customer business not found');
        }

        const removedBusiness = await this.prisma.customerBusiness.update({
            where: { id: business.id },
            data: {
                isActive: false,
                isPrimary: false,
            },
        });

        await this.syncCustomerTypeByBusinesses(customer.id);

        return removedBusiness;
    }

    /* =====================================================
       HELPERS
       ===================================================== */

    private async getOwnedCustomer(customerId: string, user: JwtUser) {
        if (user.role !== Role.BRAND_OWNER) {
            throw new ForbiddenException('Access denied');
        }

        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { userId: user.id },
        });

        if (!brandOwner) {
            throw new ForbiddenException('BrandOwner profile not found');
        }

        const customer = await this.prisma.customer.findFirst({
            where: {
                id: customerId,
                brandOwnerId: brandOwner.id,
                isDeleted: false,
            },
        });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        return customer;
    }

    private async validateShopOwnerLink(brandOwnerId: string, shopOwnerId: string) {
        const shopOwner = await this.prisma.shopOwner.findUnique({
            where: { id: shopOwnerId },
        });

        if (!shopOwner || !shopOwner.isActive) {
            throw new BadRequestException('Invalid shop owner');
        }

        const link = await this.prisma.brandOwnerShop.findFirst({
            where: {
                brandOwnerId,
                shopOwnerId,
                isActive: true,
            },
        });

        if (!link) {
            throw new BadRequestException(
                'Selected ShopOwner is not linked with this BrandOwner',
            );
        }
    }

    private async unsetPrimaryBusinesses(customerId: string, excludeBusinessId?: string) {
        await this.prisma.customerBusiness.updateMany({
            where: {
                customerId,
                isPrimary: true,
                ...(excludeBusinessId ? { id: { not: excludeBusinessId } } : {}),
            },
            data: {
                isPrimary: false,
            },
        });
    }

    private async syncCustomerTypeByBusinesses(customerId: string) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
            select: {
                id: true,
                type: true,
            },
        });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        const activeBusinessCount = await this.prisma.customerBusiness.count({
            where: {
                customerId,
                isActive: true,
            },
        });

        let nextType: CustomerType = customer.type;

        if (activeBusinessCount > 0) {
            nextType = CustomerType.BUSINESS;
        } else {
            nextType = CustomerType.INDIVIDUAL;
        }

        if (nextType !== customer.type) {
            await this.prisma.customer.update({
                where: { id: customerId },
                data: {
                    type: nextType,
                },
            });
        }
    }
}