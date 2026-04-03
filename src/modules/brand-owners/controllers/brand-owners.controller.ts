import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
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

@ApiTags('Brand Owners')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('brand-owners')
export class BrandOwnersController {
    constructor(private readonly service: BrandOwnersService) { }

    /* =====================================================
       GET OWN LOCATION SETTINGS
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Get('me/location')
    getMyLocation(@CurrentUser() user: JwtUser) {
        return this.service.getMyLocation(user);
    }

    /* =====================================================
       UPDATE OWN LOCATION SETTINGS
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Patch('me/location')
    updateMyLocation(
        @Body() dto: UpdateBrandOwnerLocationDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.updateMyLocation(dto, user);
    }

    /* =====================================================
       GET OWN LANGUAGE SETTINGS
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Get('me/language')
    getMyLanguage(@CurrentUser() user: JwtUser) {
        return this.service.getMyLanguage(user);
    }

    /* =====================================================
       UPDATE OWN LANGUAGE SETTINGS
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Patch('me/language')
    updateMyLanguage(
        @Body() dto: UpdateBrandOwnerLanguageDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.updateMyLanguage(dto, user);
    }

    /* =====================================================
       GET OWN SERVICE AREA SUMMARY
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Get('me/service-area')
    getMyServiceArea(@CurrentUser() user: JwtUser) {
        return this.service.getMyServiceArea(user);
    }

    /* =====================================================
       GET OWN SERVICE AREA DISTRICTS FOR A STATE
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Get('me/service-area/states/:stateId/districts')
    getMyServiceAreaDistricts(
        @Param('stateId', new ParseUUIDPipe()) stateId: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.getMyServiceAreaDistricts(stateId, user);
    }

    /* =====================================================
       UPDATE OWN SERVICE AREA STATE
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Patch('me/service-area/states/:stateId')
    updateMyServiceAreaState(
        @Param('stateId', new ParseUUIDPipe()) stateId: string,
        @Body() dto: UpdateServiceAreaStateDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.updateMyServiceAreaState(stateId, dto, user);
    }

    /* =====================================================
       UPDATE OWN SERVICE AREA DISTRICT
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Patch('me/service-area/districts/:districtId')
    updateMyServiceAreaDistrict(
        @Param('districtId', new ParseUUIDPipe()) districtId: string,
        @Body() dto: UpdateServiceAreaDistrictDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.updateMyServiceAreaDistrict(districtId, dto, user);
    }

    /* =====================================================
   GET OWN SHOP ORDER RULES
   ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Get('me/shop-order-rules')
    getMyShopOrderRules(@CurrentUser() user: JwtUser) {
        return this.service.getMyShopOrderRules(user);
    }

    /* =====================================================
       UPDATE OWN SHOP ORDER RULES
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Patch('me/shop-order-rules')
    updateMyShopOrderRules(
        @Body() dto: UpdateBrandOwnerShopOrderRulesDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.updateMyShopOrderRules(dto, user);
    }
}