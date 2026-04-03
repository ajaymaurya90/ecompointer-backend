import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StorefrontAuthService } from '../services/storefront-auth.service';
import { StorefrontRegisterDto } from '../dto/storefront-register.dto';
import { StorefrontLoginDto } from '../dto/storefront-login.dto';
import { StorefrontCustomerGuard } from '../guards/storefront-customer.guard';
import { CurrentStorefrontCustomer } from '../decorators/current-storefront-customer.decorator';
import type { StorefrontCustomerJwt } from '../interfaces/storefront-customer-jwt.interface';

@ApiTags('Storefront Auth')
@Controller('storefront/auth')
export class StorefrontAuthController {
    constructor(
        private readonly storefrontAuthService: StorefrontAuthService,
    ) { }

    /* =====================================================
       REGISTER STOREFRONT CUSTOMER
       ===================================================== */
    @Post('register/brand-owner/:brandOwnerId')
    register(
        @Param('brandOwnerId', new ParseUUIDPipe()) brandOwnerId: string,
        @Body() dto: StorefrontRegisterDto,
    ) {
        return this.storefrontAuthService.register(brandOwnerId, dto);
    }

    /* =====================================================
       LOGIN STOREFRONT CUSTOMER
       ===================================================== */
    @Post('login/brand-owner/:brandOwnerId')
    login(
        @Param('brandOwnerId', new ParseUUIDPipe()) brandOwnerId: string,
        @Body() dto: StorefrontLoginDto,
    ) {
        return this.storefrontAuthService.login(brandOwnerId, dto);
    }

    /* =====================================================
       GET CURRENT STOREFRONT CUSTOMER PROFILE
       ===================================================== */
    @UseGuards(StorefrontCustomerGuard)
    @Get('me')
    me(
        @CurrentStorefrontCustomer() customer: StorefrontCustomerJwt,
    ) {
        return this.storefrontAuthService.me(customer);
    }
}