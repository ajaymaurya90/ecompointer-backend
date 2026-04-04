import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtUser } from 'src/auth/types/jwt-user.type';

import { BrandOwnersService } from '../services/brand-owners.service';
import { UpdateBrandOwnerLocationDto } from '../dto/update-brand-owner-location.dto';
import { UpdateBrandOwnerLanguageDto } from '../dto/update-brand-owner-language.dto';
import { UpdateServiceAreaStateDto } from '../dto/update-service-area-state.dto';
import { UpdateServiceAreaDistrictDto } from '../dto/update-service-area-district.dto';
import { UpdateBrandOwnerShopOrderRulesDto } from '../dto/update-brand-owner-shop-order-rules.dto';
import { UpdateBrandOwnerStorefrontSettingsDto } from '../dto/update-brand-owner-storefront-settings.dto';
import { CreateBrandOwnerStorefrontDomainDto } from '../dto/create-brand-owner-storefront-domain.dto';
import { UpdateBrandOwnerStorefrontDomainDto } from '../dto/update-brand-owner-storefront-domain.dto';

@ApiTags('Brand Owners')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('brand-owners')
export class BrandOwnersController {
    constructor(private readonly service: BrandOwnersService) { }

    @Roles(Role.BRAND_OWNER)
    @Get('me/location')
    getMyLocation(@CurrentUser() user: JwtUser) {
        return this.service.getMyLocation(user);
    }

    @Roles(Role.BRAND_OWNER)
    @Patch('me/location')
    updateMyLocation(
        @Body() dto: UpdateBrandOwnerLocationDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.updateMyLocation(dto, user);
    }

    @Roles(Role.BRAND_OWNER)
    @Get('me/language')
    getMyLanguage(@CurrentUser() user: JwtUser) {
        return this.service.getMyLanguage(user);
    }

    @Roles(Role.BRAND_OWNER)
    @Patch('me/language')
    updateMyLanguage(
        @Body() dto: UpdateBrandOwnerLanguageDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.updateMyLanguage(dto, user);
    }

    @Roles(Role.BRAND_OWNER)
    @Get('me/service-area')
    getMyServiceArea(@CurrentUser() user: JwtUser) {
        return this.service.getMyServiceArea(user);
    }

    @Roles(Role.BRAND_OWNER)
    @Get('me/service-area/states/:stateId/districts')
    getMyServiceAreaDistricts(
        @Param('stateId', new ParseUUIDPipe()) stateId: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.getMyServiceAreaDistricts(stateId, user);
    }

    @Roles(Role.BRAND_OWNER)
    @Patch('me/service-area/states/:stateId')
    updateMyServiceAreaState(
        @Param('stateId', new ParseUUIDPipe()) stateId: string,
        @Body() dto: UpdateServiceAreaStateDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.updateMyServiceAreaState(stateId, dto, user);
    }

    @Roles(Role.BRAND_OWNER)
    @Patch('me/service-area/districts/:districtId')
    updateMyServiceAreaDistrict(
        @Param('districtId', new ParseUUIDPipe()) districtId: string,
        @Body() dto: UpdateServiceAreaDistrictDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.updateMyServiceAreaDistrict(districtId, dto, user);
    }

    @Roles(Role.BRAND_OWNER)
    @Get('me/shop-order-rules')
    getMyShopOrderRules(@CurrentUser() user: JwtUser) {
        return this.service.getMyShopOrderRules(user);
    }

    @Roles(Role.BRAND_OWNER)
    @Patch('me/shop-order-rules')
    updateMyShopOrderRules(
        @Body() dto: UpdateBrandOwnerShopOrderRulesDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.updateMyShopOrderRules(dto, user);
    }

    @Roles(Role.BRAND_OWNER)
    @Get('me/storefront-settings')
    getMyStorefrontSettings(@CurrentUser() user: JwtUser) {
        return this.service.getMyStorefrontSettings(user);
    }

    @Roles(Role.BRAND_OWNER)
    @Patch('me/storefront-settings')
    updateMyStorefrontSettings(
        @Body() dto: UpdateBrandOwnerStorefrontSettingsDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.updateMyStorefrontSettings(dto, user);
    }

    /* =====================================================
       LIST OWN STOREFRONT DOMAINS
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Get('me/storefront-domains')
    getMyStorefrontDomains(@CurrentUser() user: JwtUser) {
        return this.service.getMyStorefrontDomains(user);
    }

    /* =====================================================
       CREATE OWN STOREFRONT DOMAIN
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Post('me/storefront-domains')
    createMyStorefrontDomain(
        @Body() dto: CreateBrandOwnerStorefrontDomainDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.createMyStorefrontDomain(dto, user);
    }

    /* =====================================================
       UPDATE OWN STOREFRONT DOMAIN
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Patch('me/storefront-domains/:domainId')
    updateMyStorefrontDomain(
        @Param('domainId', new ParseUUIDPipe()) domainId: string,
        @Body() dto: UpdateBrandOwnerStorefrontDomainDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.updateMyStorefrontDomain(domainId, dto, user);
    }

    /* =====================================================
       DELETE OWN STOREFRONT DOMAIN
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Delete('me/storefront-domains/:domainId')
    deleteMyStorefrontDomain(
        @Param('domainId', new ParseUUIDPipe()) domainId: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.deleteMyStorefrontDomain(domainId, user);
    }
}