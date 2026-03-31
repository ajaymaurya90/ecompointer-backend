import {
    Body,
    Controller,
    Get,
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
}