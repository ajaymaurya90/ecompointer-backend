import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import type { JwtUser } from 'src/auth/types/jwt-user.type';

import { UpdateBrandOwnerLocationDto } from '../dto/update-brand-owner-location.dto';
import { UpdateBrandOwnerLanguageDto } from '../dto/update-brand-owner-language.dto';

@Injectable()
export class BrandOwnersService {
    constructor(private readonly prisma: PrismaService) { }

    /* =====================================================
       GET OWN BRAND OWNER LOCATION
       ===================================================== */
    async getMyLocation(user: JwtUser) {
        const brandOwner = await this.getOwnedBrandOwner(user);

        return this.prisma.brandOwner.findUnique({
            where: { id: brandOwner.id },
            select: {
                id: true,
                businessName: true,
                phone: true,
                address: true,
                city: true,
                countryId: true,
                stateId: true,
                districtId: true,
                countryRef: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        phoneCode: true,
                        currencyCode: true,
                    },
                },
                stateRef: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        countryId: true,
                    },
                },
                districtRef: {
                    select: {
                        id: true,
                        name: true,
                        stateId: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        role: true,
                    },
                },
            },
        });
    }

    /* =====================================================
       UPDATE OWN LOCATION SETTINGS
       ===================================================== */
    async updateMyLocation(dto: UpdateBrandOwnerLocationDto, user: JwtUser) {
        const brandOwner = await this.getOwnedBrandOwner(user);

        const current = await this.prisma.brandOwner.findUnique({
            where: { id: brandOwner.id },
            select: {
                id: true,
                countryId: true,
                stateId: true,
                districtId: true,
                city: true,
                address: true,
            },
        });

        if (!current) {
            throw new NotFoundException('BrandOwner not found');
        }

        const nextCountryId =
            dto.countryId !== undefined
                ? dto.countryId || undefined
                : current.countryId || undefined;

        const nextStateId =
            dto.stateId !== undefined
                ? dto.stateId || undefined
                : current.stateId || undefined;

        const nextDistrictId =
            dto.districtId !== undefined
                ? dto.districtId || undefined
                : current.districtId || undefined;

        await this.validateGeoRefs(nextCountryId, nextStateId, nextDistrictId);

        return this.prisma.brandOwner.update({
            where: { id: brandOwner.id },
            data: {
                ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
                ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),

                ...(dto.countryId !== undefined
                    ? {
                        countryId: dto.countryId || null,
                        country: null,
                    }
                    : {}),

                ...(dto.stateId !== undefined
                    ? {
                        stateId: dto.stateId || null,
                        state: null,
                    }
                    : {}),

                ...(dto.districtId !== undefined
                    ? {
                        districtId: dto.districtId || null,
                    }
                    : {}),
            },
            select: {
                id: true,
                businessName: true,
                phone: true,
                address: true,
                city: true,
                countryId: true,
                stateId: true,
                districtId: true,
                countryRef: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        phoneCode: true,
                        currencyCode: true,
                    },
                },
                stateRef: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        countryId: true,
                    },
                },
                districtRef: {
                    select: {
                        id: true,
                        name: true,
                        stateId: true,
                    },
                },
            },
        });
    }

    /* =====================================================
       GET OWN BRAND OWNER LANGUAGE
       ===================================================== */
    async getMyLanguage(user: JwtUser) {
        const brandOwner = await this.getOwnedBrandOwner(user);

        return this.prisma.brandOwner.findUnique({
            where: { id: brandOwner.id },
            select: {
                id: true,
                businessName: true,
                language: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
        });
    }

    /* =====================================================
       UPDATE OWN BRAND OWNER LANGUAGE
       ===================================================== */
    async updateMyLanguage(dto: UpdateBrandOwnerLanguageDto, user: JwtUser) {
        const brandOwner = await this.getOwnedBrandOwner(user);

        return this.prisma.brandOwner.update({
            where: { id: brandOwner.id },
            data: {
                language: dto.language,
            },
            select: {
                id: true,
                businessName: true,
                language: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
        });
    }

    /* =====================================================
       HELPERS
       ===================================================== */
    private async getOwnedBrandOwner(user: JwtUser) {
        if (user.role !== Role.BRAND_OWNER) {
            throw new ForbiddenException('Access denied');
        }

        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { userId: user.id },
            select: { id: true },
        });

        if (!brandOwner) {
            throw new ForbiddenException('BrandOwner profile not found');
        }

        return brandOwner;
    }

    private async validateGeoRefs(
        countryId?: string,
        stateId?: string,
        districtId?: string,
    ) {
        let state: { id: string; countryId: string } | null = null;
        let district: { id: string; stateId: string } | null = null;

        if (districtId && !stateId) {
            throw new BadRequestException(
                'stateId is required when districtId is provided',
            );
        }

        if (stateId && !countryId) {
            throw new BadRequestException(
                'countryId is required when stateId is provided',
            );
        }

        if (countryId) {
            const country = await this.prisma.country.findFirst({
                where: {
                    id: countryId,
                    isActive: true,
                },
                select: { id: true },
            });

            if (!country) {
                throw new BadRequestException('Invalid countryId');
            }
        }

        if (stateId) {
            state = await this.prisma.state.findFirst({
                where: {
                    id: stateId,
                    isActive: true,
                },
                select: {
                    id: true,
                    countryId: true,
                },
            });

            if (!state) {
                throw new BadRequestException('Invalid stateId');
            }

            if (countryId && state.countryId !== countryId) {
                throw new BadRequestException(
                    'Selected state does not belong to selected country',
                );
            }
        }

        if (districtId) {
            district = await this.prisma.district.findFirst({
                where: {
                    id: districtId,
                    isActive: true,
                },
                select: {
                    id: true,
                    stateId: true,
                },
            });

            if (!district) {
                throw new BadRequestException('Invalid districtId');
            }

            if (stateId && district.stateId !== stateId) {
                throw new BadRequestException(
                    'Selected district does not belong to selected state',
                );
            }
        }
    }
}