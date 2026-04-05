import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorefrontBootstrapCacheService } from './storefront-bootstrap-cache.service';

/**
 * ---------------------------------------------------------
 * STOREFRONT BOOTSTRAP SERVICE
 * ---------------------------------------------------------
 * Purpose:
 * Resolves storefront from BrandOwnerStorefrontDomain and
 * returns public bootstrap payload using storefront setting
 * and theme models.
 *
 * Optimizations:
 * - exact normalized host lookup
 * - small in-memory host cache
 * - reusable invalidation support
 * ---------------------------------------------------------
 */
@Injectable()
export class StorefrontBootstrapService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: StorefrontBootstrapCacheService,
    ) { }

    /* =====================================================
       GET STOREFRONT BOOTSTRAP BY HOST
       ===================================================== */
    async getBootstrapByHost(host?: string) {
        const normalizedHost = this.normalizeHost(host);

        if (!normalizedHost) {
            throw new BadRequestException('host is required');
        }

        // CHANGED: return cached bootstrap immediately when present for faster repeated requests.
        const cached = this.cache.get<any>(normalizedHost);
        if (cached) {
            return cached;
        }

        const domain = await this.prisma.brandOwnerStorefrontDomain.findFirst({
            where: {
                hostName: normalizedHost,
                isActive: true,
            },
            select: {
                id: true,
                hostName: true,
                isPrimary: true,
                isVerified: true,
                brandOwnerId: true,
            },
        });

        if (!domain) {
            throw new NotFoundException('Storefront domain not found');
        }

        // CHANGED: ensure default storefront rows exist before reading merged bootstrap payload.
        await this.ensureStorefrontDefaults(domain.brandOwnerId);

        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { id: domain.brandOwnerId },
            select: {
                id: true,
                businessName: true,
                isActive: true,
                storefrontSetting: {
                    select: {
                        storefrontName: true,
                        tagline: true,
                        shortDescription: true,
                        aboutDescription: true,
                        logoUrl: true,
                        faviconUrl: true,
                        supportEmail: true,
                        supportPhone: true,
                        isStorefrontEnabled: true,
                        isGuestCheckoutEnabled: true,
                        isCustomerRegistrationEnabled: true,
                        primaryColor: true,
                        secondaryColor: true,
                        currencyCode: true,
                        seoTitle: true,
                        seoDescription: true,
                    },
                },
                storefrontTheme: {
                    select: {
                        activeThemeCode: true,
                        isThemeActive: true,
                        themeConfigJson: true,
                    },
                },
            },
        });

        if (!brandOwner) {
            throw new NotFoundException('Storefront not found');
        }

        if (!brandOwner.isActive) {
            throw new BadRequestException('Storefront is not available');
        }

        if (!brandOwner.storefrontSetting?.isStorefrontEnabled) {
            throw new BadRequestException('Storefront is disabled');
        }

        const storefrontName =
            brandOwner.storefrontSetting?.storefrontName ||
            brandOwner.businessName;

        const payload = {
            domain: {
                id: domain.id,
                hostName: domain.hostName,
                isPrimary: domain.isPrimary,
                isVerified: domain.isVerified,
            },
            brandOwner: {
                id: brandOwner.id,
                businessName: brandOwner.businessName,
            },
            storefront: {
                storefrontName,
                tagline: brandOwner.storefrontSetting?.tagline || null,
                shortDescription:
                    brandOwner.storefrontSetting?.shortDescription || null,
                aboutDescription:
                    brandOwner.storefrontSetting?.aboutDescription || null,
                logoUrl: brandOwner.storefrontSetting?.logoUrl || null,
                faviconUrl: brandOwner.storefrontSetting?.faviconUrl || null,
                supportEmail: brandOwner.storefrontSetting?.supportEmail || null,
                supportPhone: brandOwner.storefrontSetting?.supportPhone || null,
                isStorefrontEnabled:
                    brandOwner.storefrontSetting?.isStorefrontEnabled ?? false,
                isGuestCheckoutEnabled:
                    brandOwner.storefrontSetting?.isGuestCheckoutEnabled ?? true,
                isCustomerRegistrationEnabled:
                    brandOwner.storefrontSetting?.isCustomerRegistrationEnabled ??
                    true,
                primaryColor:
                    brandOwner.storefrontSetting?.primaryColor || '#111827',
                secondaryColor:
                    brandOwner.storefrontSetting?.secondaryColor || '#6b7280',
                currencyCode:
                    brandOwner.storefrontSetting?.currencyCode || 'INR',
                seoTitle: brandOwner.storefrontSetting?.seoTitle || null,
                seoDescription:
                    brandOwner.storefrontSetting?.seoDescription || null,
            },
            theme: {
                activeThemeCode:
                    brandOwner.storefrontTheme?.activeThemeCode || 'default',
                isThemeActive:
                    brandOwner.storefrontTheme?.isThemeActive ?? true,
                themeConfigJson:
                    brandOwner.storefrontTheme?.themeConfigJson || null,
            },
        };

        // CHANGED: cache the final payload by exact normalized host for faster next request.
        this.cache.set(normalizedHost, payload);

        return payload;
    }

    /* =====================================================
       CACHE INVALIDATION HELPERS
       ===================================================== */

    // CHANGED: allow other services to invalidate one exact host cache entry.
    invalidateHostCache(host: string) {
        const normalizedHost = this.normalizeHost(host);

        if (!normalizedHost) {
            return;
        }

        this.cache.delete(normalizedHost);
    }

    // CHANGED: allow BO-level invalidation after settings/theme/domain updates.
    invalidateBrandOwnerCache(brandOwnerId: string) {
        this.cache.deleteByBrandOwnerId(brandOwnerId);
    }

    /* =====================================================
       HELPERS
       ===================================================== */

    // CHANGED: keep host normalization centralized and consistent with domain lookup rules.
    private normalizeHost(host?: string | null) {
        if (!host) {
            return '';
        }

        return host
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, '')
            .split('/')[0];
    }

    // CHANGED: create default storefront settings/theme rows only once for existing BOs.
    private async ensureStorefrontDefaults(brandOwnerId: string) {
        const brandOwnerExists = await this.prisma.brandOwner.findUnique({
            where: { id: brandOwnerId },
            select: { id: true },
        });

        if (!brandOwnerExists) {
            return;
        }

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
}