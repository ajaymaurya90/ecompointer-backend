import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * ---------------------------------------------------------
 * STOREFRONT BOOTSTRAP SERVICE
 * ---------------------------------------------------------
 * Purpose:
 * Resolves storefront from BrandOwnerStorefrontDomain and
 * returns public bootstrap payload using storefront setting
 * and theme models.
 * ---------------------------------------------------------
 */
@Injectable()
export class StorefrontBootstrapService {
    constructor(private readonly prisma: PrismaService) { }

    /* =====================================================
       GET STOREFRONT BOOTSTRAP BY HOST
       ===================================================== */
    async getBootstrapByHost(host?: string) {
        const normalizedHost = this.normalizeHost(host);

        if (!normalizedHost) {
            throw new BadRequestException('host is required');
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

        return {
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
    }

    /* =====================================================
       HELPERS
       ===================================================== */

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