import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StorefrontBootstrapService } from '../services/storefront-bootstrap.service';

/**
 * ---------------------------------------------------------
 * STOREFRONT BOOTSTRAP CONTROLLER
 * ---------------------------------------------------------
 * Purpose:
 * Public storefront bootstrap endpoint that resolves the
 * correct Brand Owner from the incoming host.
 * ---------------------------------------------------------
 */
@ApiTags('Storefront Bootstrap')
@Controller('storefront/bootstrap')
export class StorefrontBootstrapController {
    constructor(
        private readonly storefrontBootstrapService: StorefrontBootstrapService,
    ) { }

    /* =====================================================
       RESOLVE STOREFRONT BOOTSTRAP BY HOST
       ===================================================== */
    @Get('resolve/by-host')
    getBootstrapByHost(
        @Query('host') host?: string,
    ) {
        return this.storefrontBootstrapService.getBootstrapByHost(host);
    }
}