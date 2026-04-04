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
import { UpdateBrandOwnerShopOrderRulesDto } from '../dto/update-brand-owner-shop-order-rules.dto';
import { UpdateBrandOwnerStorefrontSettingsDto } from '../dto/update-brand-owner-storefront-settings.dto';
import { CreateBrandOwnerStorefrontDomainDto } from '../dto/create-brand-owner-storefront-domain.dto';
import { UpdateBrandOwnerStorefrontDomainDto } from '../dto/update-brand-owner-storefront-domain.dto';

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

        // Resolve next geo ids before validation so partial updates still validate correctly.
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

        // Validate geo reference consistency across country, state, and district.
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

        // Count district-level inactive overrides per state so effective totals stay accurate.
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

            // District inherits active state from parent unless there is an explicit override.
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

        // Delete override row when requested value matches inherited default state.
        if (dto.isActive === inheritedDefault) {
            await this.prisma.brandOwnerState.deleteMany({
                where: {
                    brandOwnerId: brandOwner.id,
                    stateId: state.id,
                },
            });
        } else {
            // Upsert override row when BO intentionally differs from master default.
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

        // Prevent impossible district activation when parent state is disabled.
        if (!effectiveParentStateActive && dto.isActive === true) {
            throw new BadRequestException(
                'Cannot activate a district while its parent state is inactive',
            );
        }

        const inheritedDefault = effectiveParentStateActive;

        // Delete override row when requested value matches inherited parent behavior.
        if (dto.isActive === inheritedDefault) {
            await this.prisma.brandOwnerDistrict.deleteMany({
                where: {
                    brandOwnerId: brandOwner.id,
                    districtId: district.id,
                },
            });
        } else {
            // Upsert override row when BO intentionally differs from inherited state behavior.
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
       GET OWN SHOP ORDER RULES
       ===================================================== */
    async getMyShopOrderRules(user: JwtUser) {
        const brandOwner = await this.getOwnedBrandOwner(user);

        return this.prisma.brandOwner.findUnique({
            where: { id: brandOwner.id },
            select: {
                id: true,
                businessName: true,
                minShopOrderLineQty: true,
                minShopOrderCartQty: true,
                allowBelowMinLineQtyAfterCartMin: true,
            },
        });
    }

    /* =====================================================
       UPDATE OWN SHOP ORDER RULES
       ===================================================== */
    async updateMyShopOrderRules(
        dto: UpdateBrandOwnerShopOrderRulesDto,
        user: JwtUser,
    ) {
        const brandOwner = await this.getOwnedBrandOwner(user);

        const current = await this.prisma.brandOwner.findUnique({
            where: { id: brandOwner.id },
            select: {
                id: true,
                minShopOrderLineQty: true,
                minShopOrderCartQty: true,
                allowBelowMinLineQtyAfterCartMin: true,
            },
        });

        if (!current) {
            throw new NotFoundException('BrandOwner not found');
        }

        // Resolve final rule values first so cross-field validation uses actual next state.
        const nextMinLineQty =
            dto.minShopOrderLineQty ?? current.minShopOrderLineQty;

        const nextMinCartQty =
            dto.minShopOrderCartQty ?? current.minShopOrderCartQty;

        if (nextMinLineQty > nextMinCartQty) {
            throw new BadRequestException(
                'minShopOrderLineQty cannot be greater than minShopOrderCartQty',
            );
        }

        return this.prisma.brandOwner.update({
            where: { id: brandOwner.id },
            data: {
                ...(dto.minShopOrderLineQty !== undefined
                    ? { minShopOrderLineQty: dto.minShopOrderLineQty }
                    : {}),
                ...(dto.minShopOrderCartQty !== undefined
                    ? { minShopOrderCartQty: dto.minShopOrderCartQty }
                    : {}),
                ...(dto.allowBelowMinLineQtyAfterCartMin !== undefined
                    ? {
                        allowBelowMinLineQtyAfterCartMin:
                            dto.allowBelowMinLineQtyAfterCartMin,
                    }
                    : {}),
            },
            select: {
                id: true,
                businessName: true,
                minShopOrderLineQty: true,
                minShopOrderCartQty: true,
                allowBelowMinLineQtyAfterCartMin: true,
            },
        });
    }

    /* =====================================================
       GET OWN STOREFRONT SETTINGS
       ===================================================== */
    async getMyStorefrontSettings(user: JwtUser) {
        const brandOwner = await this.getOwnedBrandOwner(user);

        // Ensure default storefront setting + theme rows exist for existing BOs.
        await this.ensureStorefrontDefaults(brandOwner.id);

        const [setting, theme] = await this.prisma.$transaction([
            this.prisma.brandOwnerStorefrontSetting.findUnique({
                where: { brandOwnerId: brandOwner.id },
            }),
            this.prisma.brandOwnerStorefrontTheme.findUnique({
                where: { brandOwnerId: brandOwner.id },
            }),
        ]);

        return {
            id: brandOwner.id,
            businessName: await this.getBrandOwnerBusinessName(brandOwner.id),
            storefrontName: setting?.storefrontName ?? null,
            storefrontLogoUrl: setting?.logoUrl ?? null,
            storefrontTagline: setting?.tagline ?? null,
            storefrontShortDescription: setting?.shortDescription ?? null,
            storefrontAboutDescription: setting?.aboutDescription ?? null,
            storefrontSupportEmail: setting?.supportEmail ?? null,
            storefrontSupportPhone: setting?.supportPhone ?? null,
            isStorefrontEnabled: setting?.isStorefrontEnabled ?? false,
            isGuestCheckoutEnabled: setting?.isGuestCheckoutEnabled ?? true,
            isCustomerRegistrationEnabled:
                setting?.isCustomerRegistrationEnabled ?? true,
            activeStorefrontThemeCode: theme?.activeThemeCode ?? 'default',
            isStorefrontThemeActive: theme?.isThemeActive ?? true,
        };
    }

    /* =====================================================
       UPDATE OWN STOREFRONT SETTINGS
       ===================================================== */
    async updateMyStorefrontSettings(
        dto: UpdateBrandOwnerStorefrontSettingsDto,
        user: JwtUser,
    ) {
        const brandOwner = await this.getOwnedBrandOwner(user);

        // Ensure storefront rows exist before partial update is applied.
        await this.ensureStorefrontDefaults(brandOwner.id);

        const [updatedSetting, updatedTheme, businessName] =
            await this.prisma.$transaction(async (tx) => {
                const setting = await tx.brandOwnerStorefrontSetting.update({
                    where: { brandOwnerId: brandOwner.id },
                    data: {
                        ...(dto.storefrontName !== undefined
                            ? { storefrontName: this.toNullableTrimmed(dto.storefrontName) }
                            : {}),
                        ...(dto.storefrontLogoUrl !== undefined
                            ? { logoUrl: this.toNullableTrimmed(dto.storefrontLogoUrl) }
                            : {}),
                        ...(dto.storefrontTagline !== undefined
                            ? { tagline: this.toNullableTrimmed(dto.storefrontTagline) }
                            : {}),
                        ...(dto.storefrontShortDescription !== undefined
                            ? {
                                shortDescription: this.toNullableTrimmed(
                                    dto.storefrontShortDescription,
                                ),
                            }
                            : {}),
                        ...(dto.storefrontAboutDescription !== undefined
                            ? {
                                aboutDescription: this.toNullableTrimmed(
                                    dto.storefrontAboutDescription,
                                ),
                            }
                            : {}),
                        ...(dto.storefrontSupportEmail !== undefined
                            ? {
                                supportEmail: this.toNullableTrimmed(
                                    dto.storefrontSupportEmail,
                                ),
                            }
                            : {}),
                        ...(dto.storefrontSupportPhone !== undefined
                            ? {
                                supportPhone: this.toNullableTrimmed(
                                    dto.storefrontSupportPhone,
                                ),
                            }
                            : {}),
                        ...(dto.isStorefrontEnabled !== undefined
                            ? { isStorefrontEnabled: dto.isStorefrontEnabled }
                            : {}),
                        ...(dto.isGuestCheckoutEnabled !== undefined
                            ? {
                                isGuestCheckoutEnabled:
                                    dto.isGuestCheckoutEnabled,
                            }
                            : {}),
                        ...(dto.isCustomerRegistrationEnabled !== undefined
                            ? {
                                isCustomerRegistrationEnabled:
                                    dto.isCustomerRegistrationEnabled,
                            }
                            : {}),
                    },
                });

                const theme = await tx.brandOwnerStorefrontTheme.update({
                    where: { brandOwnerId: brandOwner.id },
                    data: {
                        ...(dto.activeStorefrontThemeCode !== undefined
                            ? {
                                activeThemeCode:
                                    this.toNullableTrimmed(
                                        dto.activeStorefrontThemeCode,
                                    ) ?? 'default',
                            }
                            : {}),
                        ...(dto.isStorefrontThemeActive !== undefined
                            ? { isThemeActive: dto.isStorefrontThemeActive }
                            : {}),
                    },
                });

                const owner = await tx.brandOwner.findUnique({
                    where: { id: brandOwner.id },
                    select: { businessName: true },
                });

                return [setting, theme, owner?.businessName ?? null] as const;
            });

        return {
            id: brandOwner.id,
            businessName: businessName,
            storefrontName: updatedSetting.storefrontName ?? null,
            storefrontLogoUrl: updatedSetting.logoUrl ?? null,
            storefrontTagline: updatedSetting.tagline ?? null,
            storefrontShortDescription: updatedSetting.shortDescription ?? null,
            storefrontAboutDescription: updatedSetting.aboutDescription ?? null,
            storefrontSupportEmail: updatedSetting.supportEmail ?? null,
            storefrontSupportPhone: updatedSetting.supportPhone ?? null,
            isStorefrontEnabled: updatedSetting.isStorefrontEnabled,
            isGuestCheckoutEnabled: updatedSetting.isGuestCheckoutEnabled,
            isCustomerRegistrationEnabled:
                updatedSetting.isCustomerRegistrationEnabled,
            activeStorefrontThemeCode: updatedTheme.activeThemeCode,
            isStorefrontThemeActive: updatedTheme.isThemeActive,
        };
    }

    /* =====================================================
   LIST OWN STOREFRONT DOMAINS
   ===================================================== */
    async getMyStorefrontDomains(user: JwtUser) {
        const brandOwner = await this.getOwnedBrandOwner(user);

        return this.prisma.brandOwnerStorefrontDomain.findMany({
            where: {
                brandOwnerId: brandOwner.id,
            },
            orderBy: [
                { isPrimary: 'desc' },
                { createdAt: 'asc' },
            ],
            select: {
                id: true,
                brandOwnerId: true,
                hostName: true,
                isPrimary: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    /* =====================================================
       CREATE OWN STOREFRONT DOMAIN
       ===================================================== */
    async createMyStorefrontDomain(
        dto: CreateBrandOwnerStorefrontDomainDto,
        user: JwtUser,
    ) {
        const brandOwner = await this.getOwnedBrandOwner(user);

        // Normalize host before save so DB lookup stays consistent.
        const normalizedHost = this.normalizeStorefrontDomainHost(dto.hostName);

        const existing = await this.prisma.brandOwnerStorefrontDomain.findFirst({
            where: {
                hostName: normalizedHost,
            },
            select: {
                id: true,
                brandOwnerId: true,
            },
        });

        if (existing) {
            throw new BadRequestException('This storefront domain already exists');
        }

        const shouldBePrimary = dto.isPrimary ?? false;
        const shouldBeActive = dto.isActive ?? true;

        const created = await this.prisma.$transaction(async (tx) => {
            // When a new domain becomes primary, reset previous primary flags first.
            if (shouldBePrimary) {
                await tx.brandOwnerStorefrontDomain.updateMany({
                    where: {
                        brandOwnerId: brandOwner.id,
                        isPrimary: true,
                    },
                    data: {
                        isPrimary: false,
                    },
                });
            }

            return tx.brandOwnerStorefrontDomain.create({
                data: {
                    brandOwnerId: brandOwner.id,
                    hostName: normalizedHost,
                    isPrimary: shouldBePrimary,
                    isActive: shouldBeActive,
                    isVerified: false,
                },
                select: {
                    id: true,
                    brandOwnerId: true,
                    hostName: true,
                    isPrimary: true,
                    isActive: true,
                    isVerified: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        });

        return created;
    }

    /* =====================================================
       UPDATE OWN STOREFRONT DOMAIN
       ===================================================== */
    async updateMyStorefrontDomain(
        domainId: string,
        dto: UpdateBrandOwnerStorefrontDomainDto,
        user: JwtUser,
    ) {
        const brandOwner = await this.getOwnedBrandOwner(user);

        const current = await this.prisma.brandOwnerStorefrontDomain.findFirst({
            where: {
                id: domainId,
                brandOwnerId: brandOwner.id,
            },
            select: {
                id: true,
                brandOwnerId: true,
                hostName: true,
                isPrimary: true,
                isActive: true,
                isVerified: true,
            },
        });

        if (!current) {
            throw new NotFoundException('Storefront domain not found');
        }

        const nextHostName =
            dto.hostName !== undefined
                ? this.normalizeStorefrontDomainHost(dto.hostName)
                : current.hostName;

        if (nextHostName !== current.hostName) {
            const duplicate = await this.prisma.brandOwnerStorefrontDomain.findFirst({
                where: {
                    hostName: nextHostName,
                    NOT: {
                        id: domainId,
                    },
                },
                select: {
                    id: true,
                },
            });

            if (duplicate) {
                throw new BadRequestException('This storefront domain already exists');
            }
        }

        const nextIsPrimary =
            dto.isPrimary !== undefined ? dto.isPrimary : current.isPrimary;

        const updated = await this.prisma.$transaction(async (tx) => {
            // If this domain is becoming primary, unset any other primary domain first.
            if (nextIsPrimary) {
                await tx.brandOwnerStorefrontDomain.updateMany({
                    where: {
                        brandOwnerId: brandOwner.id,
                        isPrimary: true,
                        NOT: {
                            id: domainId,
                        },
                    },
                    data: {
                        isPrimary: false,
                    },
                });
            }

            return tx.brandOwnerStorefrontDomain.update({
                where: { id: domainId },
                data: {
                    ...(dto.hostName !== undefined
                        ? { hostName: nextHostName }
                        : {}),
                    ...(dto.isPrimary !== undefined
                        ? { isPrimary: dto.isPrimary }
                        : {}),
                    ...(dto.isActive !== undefined
                        ? { isActive: dto.isActive }
                        : {}),
                    ...(dto.isVerified !== undefined
                        ? { isVerified: dto.isVerified }
                        : {}),
                },
                select: {
                    id: true,
                    brandOwnerId: true,
                    hostName: true,
                    isPrimary: true,
                    isActive: true,
                    isVerified: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        });

        return updated;
    }

    /* =====================================================
       DELETE OWN STOREFRONT DOMAIN
       ===================================================== */
    async deleteMyStorefrontDomain(
        domainId: string,
        user: JwtUser,
    ) {
        const brandOwner = await this.getOwnedBrandOwner(user);

        const current = await this.prisma.brandOwnerStorefrontDomain.findFirst({
            where: {
                id: domainId,
                brandOwnerId: brandOwner.id,
            },
            select: {
                id: true,
                isPrimary: true,
            },
        });

        if (!current) {
            throw new NotFoundException('Storefront domain not found');
        }

        const result = await this.prisma.$transaction(async (tx) => {
            await tx.brandOwnerStorefrontDomain.delete({
                where: {
                    id: domainId,
                },
            });

            // If deleted domain was primary, promote the oldest remaining active domain.
            if (current.isPrimary) {
                const fallbackPrimary = await tx.brandOwnerStorefrontDomain.findFirst({
                    where: {
                        brandOwnerId: brandOwner.id,
                    },
                    orderBy: [
                        { isActive: 'desc' },
                        { createdAt: 'asc' },
                    ],
                    select: {
                        id: true,
                    },
                });

                if (fallbackPrimary) {
                    await tx.brandOwnerStorefrontDomain.update({
                        where: {
                            id: fallbackPrimary.id,
                        },
                        data: {
                            isPrimary: true,
                        },
                    });
                }
            }

            return {
                message: 'Storefront domain deleted successfully',
            };
        });

        return result;
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

    // Create default storefront records once so existing BOs can use settings safely.
    private async ensureStorefrontDefaults(brandOwnerId: string) {
        await this.prisma.$transaction([
            this.prisma.brandOwnerStorefrontSetting.upsert({
                where: { brandOwnerId },
                update: {},
                create: {
                    brandOwnerId,
                    isStorefrontEnabled: false,
                    isGuestCheckoutEnabled: true,
                    isCustomerRegistrationEnabled: true,
                    currencyCode: 'INR',
                },
            }),
            this.prisma.brandOwnerStorefrontTheme.upsert({
                where: { brandOwnerId },
                update: {},
                create: {
                    brandOwnerId,
                    activeThemeCode: 'default',
                    isThemeActive: true,
                },
            }),
        ]);
    }

    // Read BO business name once for merged storefront response payload.
    private async getBrandOwnerBusinessName(brandOwnerId: string) {
        const owner = await this.prisma.brandOwner.findUnique({
            where: { id: brandOwnerId },
            select: { businessName: true },
        });

        return owner?.businessName ?? null;
    }

    // Convert empty or whitespace-only strings to null before DB write.
    private toNullableTrimmed(value?: string | null) {
        const trimmed = value?.trim();
        return trimmed ? trimmed : null;
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

    // Normalize domain host before save so all comparisons stay consistent.
    private normalizeStorefrontDomainHost(host: string) {
        const normalized = host
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, '')
            .split('/')[0];

        if (!normalized) {
            throw new BadRequestException('hostName is required');
        }

        return normalized;
    }
}