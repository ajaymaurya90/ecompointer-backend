import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { AddressType, Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import type { JwtUser } from 'src/auth/types/jwt-user.type';

import { CreateCustomerAddressDto } from '../dto/address/create-customer-address.dto';
import { UpdateCustomerAddressDto } from '../dto/address/update-customer-address.dto';

@Injectable()
export class CustomerAddressesService {
    constructor(private prisma: PrismaService) { }

    /* =====================================================
       CREATE CUSTOMER ADDRESS
       ===================================================== */
    async create(customerId: string, dto: CreateCustomerAddressDto, user: JwtUser) {
        const customer = await this.getOwnedCustomer(customerId, user);

        await this.validateGeoRefs(dto.countryId, dto.stateId, dto.districtId);

        if (dto.isDefault) {
            await this.unsetDefaultAddresses(customer.id, dto.type ?? AddressType.SHIPPING);
        }

        return this.prisma.customerAddress.create({
            data: {
                customerId: customer.id,
                type: dto.type ?? AddressType.SHIPPING,
                fullName: dto.fullName?.trim(),
                phone: dto.phone?.trim(),
                addressLine1: dto.addressLine1.trim(),
                addressLine2: dto.addressLine2?.trim(),
                landmark: dto.landmark?.trim(),
                city: dto.city.trim(),
                district: dto.district?.trim(),
                state: dto.state?.trim(),
                country: dto.country?.trim(),
                postalCode: dto.postalCode?.trim(),
                countryId: dto.countryId,
                stateId: dto.stateId,
                districtId: dto.districtId,
                isDefault: dto.isDefault ?? false,
            },
            include: {
                countryRef: true,
                stateRef: true,
                districtRef: true,
            },
        });
    }

    /* =====================================================
       UPDATE CUSTOMER ADDRESS
       ===================================================== */
    async update(
        customerId: string,
        addressId: string,
        dto: UpdateCustomerAddressDto,
        user: JwtUser,
    ) {
        const customer = await this.getOwnedCustomer(customerId, user);

        const address = await this.prisma.customerAddress.findFirst({
            where: {
                id: addressId,
                customerId: customer.id,
                isActive: true,
            },
        });

        if (!address) {
            throw new NotFoundException('Customer address not found');
        }

        const nextCountryId =
            dto.countryId !== undefined ? dto.countryId || undefined : address.countryId || undefined;

        const nextStateId =
            dto.stateId !== undefined ? dto.stateId || undefined : address.stateId || undefined;

        const nextDistrictId =
            dto.districtId !== undefined ? dto.districtId || undefined : address.districtId || undefined;

        await this.validateGeoRefs(nextCountryId, nextStateId, nextDistrictId);

        const nextType = dto.type ?? address.type;

        if (dto.isDefault === true) {
            await this.unsetDefaultAddresses(customer.id, nextType, address.id);
        }

        return this.prisma.customerAddress.update({
            where: { id: address.id },
            data: {
                ...(dto.type !== undefined ? { type: dto.type } : {}),
                ...(dto.fullName !== undefined ? { fullName: dto.fullName?.trim() || null } : {}),
                ...(dto.phone !== undefined ? { phone: dto.phone?.trim() || null } : {}),
                ...(dto.addressLine1 !== undefined ? { addressLine1: dto.addressLine1.trim() } : {}),
                ...(dto.addressLine2 !== undefined ? { addressLine2: dto.addressLine2?.trim() || null } : {}),
                ...(dto.landmark !== undefined ? { landmark: dto.landmark?.trim() || null } : {}),
                ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
                ...(dto.district !== undefined ? { district: dto.district?.trim() || null } : {}),
                ...(dto.state !== undefined ? { state: dto.state?.trim() || null } : {}),
                ...(dto.country !== undefined ? { country: dto.country?.trim() || null } : {}),
                ...(dto.postalCode !== undefined ? { postalCode: dto.postalCode?.trim() || null } : {}),
                ...(dto.countryId !== undefined ? { countryId: dto.countryId || null } : {}),
                ...(dto.stateId !== undefined ? { stateId: dto.stateId || null } : {}),
                ...(dto.districtId !== undefined ? { districtId: dto.districtId || null } : {}),
                ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
            },
            include: {
                countryRef: true,
                stateRef: true,
                districtRef: true,
            },
        });
    }

    /* =====================================================
       REMOVE CUSTOMER ADDRESS (SOFT)
       ===================================================== */
    async remove(customerId: string, addressId: string, user: JwtUser) {
        const customer = await this.getOwnedCustomer(customerId, user);

        const address = await this.prisma.customerAddress.findFirst({
            where: {
                id: addressId,
                customerId: customer.id,
                isActive: true,
            },
        });

        if (!address) {
            throw new NotFoundException('Customer address not found');
        }

        return this.prisma.customerAddress.update({
            where: { id: address.id },
            data: {
                isActive: false,
                isDefault: false,
            },
        });
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

    private async validateGeoRefs(
        countryId?: string,
        stateId?: string,
        districtId?: string,
    ) {
        let country: { id: string } | null = null;
        let state: { id: string; countryId: string } | null = null;
        let district: { id: string; stateId: string } | null = null;

        if (countryId) {
            country = await this.prisma.country.findFirst({
                where: { id: countryId, isActive: true },
                select: { id: true },
            });

            if (!country) {
                throw new BadRequestException('Invalid countryId');
            }
        }

        if (stateId) {
            state = await this.prisma.state.findFirst({
                where: { id: stateId, isActive: true },
                select: { id: true, countryId: true },
            });

            if (!state) {
                throw new BadRequestException('Invalid stateId');
            }

            if (countryId && state.countryId !== countryId) {
                throw new BadRequestException('Selected state does not belong to selected country');
            }
        }

        if (districtId) {
            district = await this.prisma.district.findFirst({
                where: { id: districtId, isActive: true },
                select: { id: true, stateId: true },
            });

            if (!district) {
                throw new BadRequestException('Invalid districtId');
            }

            if (stateId && district.stateId !== stateId) {
                throw new BadRequestException('Selected district does not belong to selected state');
            }
        }
    }

    private async unsetDefaultAddresses(
        customerId: string,
        type: AddressType,
        excludeAddressId?: string,
    ) {
        await this.prisma.customerAddress.updateMany({
            where: {
                customerId,
                type,
                isDefault: true,
                isActive: true,
                ...(excludeAddressId ? { id: { not: excludeAddressId } } : {}),
            },
            data: {
                isDefault: false,
            },
        });
    }
}