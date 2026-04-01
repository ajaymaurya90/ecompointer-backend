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
import { UpdateServiceAreaStateDto } from '../dto/update-service-area-state.dto';
import { UpdateServiceAreaDistrictDto } from '../dto/update-service-area-district.dto';

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
       GET OWN SERVICE AREA
       ===================================================== */
    async getMyServiceArea(user: JwtUser) {
        const brandOwner = await this.getOwnedBrandOwner(user);
        const brandOwnerProfile = await this.requireBrandOwnerCountry(brandOwner.id);

        const country = await this.prisma.country.findFirst({
            where: {
                id: brandOwnerProfile.countryId!,
                isActive: true,
            },
            select: {
                id: true,
                code: true,
                name: true,
            },
        });

        if (!country) {
            throw new BadRequestException('Configured business country is not active');
        }

        const states = await this.prisma.state.findMany({
            where: {
                countryId: country.id,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                code: true,
            },
            orderBy: { name: 'asc' },
        });

        const stateOverrides = await this.prisma.brandOwnerState.findMany({
            where: {
                brandOwnerId: brandOwner.id,
                state: {
                    countryId: country.id,
                },
            },
            select: {
                stateId: true,
                isActive: true,
            },
        });

        const districtOverrides = await this.prisma.brandOwnerDistrict.findMany({
            where: {
                brandOwnerId: brandOwner.id,
                district: {
                    state: {
                        countryId: country.id,
                    },
                },
            },
            select: {
                districtId: true,
                isActive: true,
                district: {
                    select: {
                        stateId: true,
                    },
                },
            },
        });

        const districtCounts = await this.prisma.district.groupBy({
            by: ['stateId'],
            where: {
                state: {
                    countryId: country.id,
                    isActive: true,
                },
                isActive: true,
            },
            _count: {
                _all: true,
            },
        });

        const stateOverrideMap = new Map(
            stateOverrides.map((item) => [item.stateId, item.isActive]),
        );

        const districtCountMap = new Map(
            districtCounts.map((item) => [item.stateId, item._count._all]),
        );

        const inactiveDistrictOverrideCountMap = new Map<string, number>();

        for (const item of districtOverrides) {
            if (item.isActive === false) {
                const currentCount =
                    inactiveDistrictOverrideCountMap.get(item.district.stateId) || 0;
                inactiveDistrictOverrideCountMap.set(
                    item.district.stateId,
                    currentCount + 1,
                );
            }
        }

        const effectiveStates = states.map((state) => {
            const override = stateOverrideMap.get(state.id);
            const isActive = override !== undefined ? override : true;
            const districtCount = districtCountMap.get(state.id) || 0;

            let activeDistrictCount = 0;

            if (isActive) {
                const inactiveOverrideCount =
                    inactiveDistrictOverrideCountMap.get(state.id) || 0;
                activeDistrictCount = Math.max(
                    districtCount - inactiveOverrideCount,
                    0,
                );
            }

            return {
                id: state.id,
                name: state.name,
                code: state.code,
                masterActive: true,
                isActive,
                source: override !== undefined ? 'override' : 'default',
                districtCount,
                activeDistrictCount,
            };
        });

        const activeStates = effectiveStates.filter((item) => item.isActive).length;

        return {
            country,
            summary: {
                totalStates: effectiveStates.length,
                activeStates,
                inactiveStates: effectiveStates.length - activeStates,
            },
            states: effectiveStates,
        };
    }

    /* =====================================================
       GET OWN SERVICE AREA DISTRICTS FOR A STATE
       ===================================================== */
    async getMyServiceAreaDistricts(stateId: string, user: JwtUser) {
        const brandOwner = await this.getOwnedBrandOwner(user);
        const brandOwnerProfile = await this.requireBrandOwnerCountry(brandOwner.id);

        const state = await this.prisma.state.findFirst({
            where: {
                id: stateId,
                countryId: brandOwnerProfile.countryId!,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                code: true,
                countryId: true,
            },
        });

        if (!state) {
            throw new NotFoundException('State not found for your business country');
        }

        const stateOverride = await this.prisma.brandOwnerState.findUnique({
            where: {
                brandOwnerId_stateId: {
                    brandOwnerId: brandOwner.id,
                    stateId: state.id,
                },
            },
            select: {
                isActive: true,
            },
        });

        const effectiveStateActive =
            stateOverride?.isActive !== undefined ? stateOverride.isActive : true;

        const districts = await this.prisma.district.findMany({
            where: {
                stateId: state.id,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });

        const districtOverrides = await this.prisma.brandOwnerDistrict.findMany({
            where: {
                brandOwnerId: brandOwner.id,
                district: {
                    stateId: state.id,
                },
            },
            select: {
                districtId: true,
                isActive: true,
            },
        });

        const districtOverrideMap = new Map(
            districtOverrides.map((item) => [item.districtId, item.isActive]),
        );

        const effectiveDistricts = districts.map((district) => {
            const override = districtOverrideMap.get(district.id);

            const isActive = effectiveStateActive
                ? override !== undefined
                    ? override
                    : true
                : false;

            return {
                id: district.id,
                name: district.name,
                masterActive: true,
                isActive,
                source: override !== undefined ? 'override' : 'default',
            };
        });

        const activeDistricts = effectiveDistricts.filter((item) => item.isActive).length;

        return {
            state: {
                id: state.id,
                name: state.name,
                code: state.code,
                isActive: effectiveStateActive,
                source:
                    stateOverride?.isActive !== undefined ? 'override' : 'default',
            },
            summary: {
                totalDistricts: effectiveDistricts.length,
                activeDistricts,
                inactiveDistricts: effectiveDistricts.length - activeDistricts,
            },
            districts: effectiveDistricts,
        };
    }

    /* =====================================================
       UPDATE OWN SERVICE AREA STATE
       ===================================================== */
    async updateMyServiceAreaState(
        stateId: string,
        dto: UpdateServiceAreaStateDto,
        user: JwtUser,
    ) {
        const brandOwner = await this.getOwnedBrandOwner(user);
        const brandOwnerProfile = await this.requireBrandOwnerCountry(brandOwner.id);

        const state = await this.prisma.state.findFirst({
            where: {
                id: stateId,
                countryId: brandOwnerProfile.countryId!,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                code: true,
            },
        });

        if (!state) {
            throw new NotFoundException('State not found for your business country');
        }

        const inheritedDefault = true;

        if (dto.isActive === inheritedDefault) {
            await this.prisma.brandOwnerState.deleteMany({
                where: {
                    brandOwnerId: brandOwner.id,
                    stateId: state.id,
                },
            });
        } else {
            await this.prisma.brandOwnerState.upsert({
                where: {
                    brandOwnerId_stateId: {
                        brandOwnerId: brandOwner.id,
                        stateId: state.id,
                    },
                },
                update: {
                    isActive: dto.isActive,
                },
                create: {
                    brandOwnerId: brandOwner.id,
                    stateId: state.id,
                    isActive: dto.isActive,
                },
            });
        }

        return {
            message: 'State service area updated successfully',
            state: {
                id: state.id,
                name: state.name,
                code: state.code,
                isActive: dto.isActive,
                source: dto.isActive === inheritedDefault ? 'default' : 'override',
            },
        };
    }

    /* =====================================================
       UPDATE OWN SERVICE AREA DISTRICT
       ===================================================== */
    async updateMyServiceAreaDistrict(
        districtId: string,
        dto: UpdateServiceAreaDistrictDto,
        user: JwtUser,
    ) {
        const brandOwner = await this.getOwnedBrandOwner(user);
        const brandOwnerProfile = await this.requireBrandOwnerCountry(brandOwner.id);

        const district = await this.prisma.district.findFirst({
            where: {
                id: districtId,
                isActive: true,
                state: {
                    countryId: brandOwnerProfile.countryId!,
                    isActive: true,
                },
            },
            select: {
                id: true,
                name: true,
                stateId: true,
                state: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });

        if (!district) {
            throw new NotFoundException('District not found for your business country');
        }

        const stateOverride = await this.prisma.brandOwnerState.findUnique({
            where: {
                brandOwnerId_stateId: {
                    brandOwnerId: brandOwner.id,
                    stateId: district.stateId,
                },
            },
            select: {
                isActive: true,
            },
        });

        const effectiveParentStateActive =
            stateOverride?.isActive !== undefined ? stateOverride.isActive : true;

        if (!effectiveParentStateActive && dto.isActive === true) {
            throw new BadRequestException(
                'Cannot activate a district while its parent state is inactive',
            );
        }

        const inheritedDefault = effectiveParentStateActive;

        if (dto.isActive === inheritedDefault) {
            await this.prisma.brandOwnerDistrict.deleteMany({
                where: {
                    brandOwnerId: brandOwner.id,
                    districtId: district.id,
                },
            });
        } else {
            await this.prisma.brandOwnerDistrict.upsert({
                where: {
                    brandOwnerId_districtId: {
                        brandOwnerId: brandOwner.id,
                        districtId: district.id,
                    },
                },
                update: {
                    isActive: dto.isActive,
                },
                create: {
                    brandOwnerId: brandOwner.id,
                    districtId: district.id,
                    isActive: dto.isActive,
                },
            });
        }

        return {
            message: 'District service area updated successfully',
            district: {
                id: district.id,
                name: district.name,
                isActive: dto.isActive,
                source: dto.isActive === inheritedDefault ? 'default' : 'override',
            },
        };
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

    private async requireBrandOwnerCountry(brandOwnerId: string) {
        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { id: brandOwnerId },
            select: {
                id: true,
                countryId: true,
            },
        });

        if (!brandOwner) {
            throw new NotFoundException('BrandOwner not found');
        }

        if (!brandOwner.countryId) {
            throw new BadRequestException(
                'Please configure your business country before managing service area',
            );
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