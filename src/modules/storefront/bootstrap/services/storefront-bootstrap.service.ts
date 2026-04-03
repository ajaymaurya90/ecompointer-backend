import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StorefrontBootstrapService {
    constructor(private readonly prisma: PrismaService) { }

    /* =====================================================
       GET STOREFRONT BOOTSTRAP DATA
       ===================================================== */
    async getBootstrapByBrandOwnerId(brandOwnerId: string) {
        // Load brand owner basic identity along with storefront settings and theme.
        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { id: brandOwnerId },
            select: {
                id: true,
                businessName: true,
                isActive: true,
                storefrontSetting: {
                    select: {
                        storefrontName: true,
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

        // Stop immediately when BO does not exist.
        if (!brandOwner) {
            throw new NotFoundException('Storefront not found');
        }

        // Prevent storefront rendering for inactive brand owners.
        if (!brandOwner.isActive) {
            throw new BadRequestException('Storefront is not available');
        }

        // Use BO business name as fallback storefront name when no explicit setting exists.
        const storefrontName =
            brandOwner.storefrontSetting?.storefrontName ||
            brandOwner.businessName;

        return {
            brandOwner: {
                id: brandOwner.id,
                businessName: brandOwner.businessName,
            },
            storefront: {
                storefrontName,
                logoUrl: brandOwner.storefrontSetting?.logoUrl || null,
                faviconUrl: brandOwner.storefrontSetting?.faviconUrl || null,
                supportEmail: brandOwner.storefrontSetting?.supportEmail || null,
                supportPhone: brandOwner.storefrontSetting?.supportPhone || null,
                isStorefrontEnabled:
                    brandOwner.storefrontSetting?.isStorefrontEnabled ?? true,
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
}