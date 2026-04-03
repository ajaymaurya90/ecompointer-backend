import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StorefrontBootstrapService } from '../services/storefront-bootstrap.service';

@ApiTags('Storefront Bootstrap')
@Controller('storefront/bootstrap')
export class StorefrontBootstrapController {
    constructor(
        private readonly storefrontBootstrapService: StorefrontBootstrapService,
    ) { }

    /* =====================================================
       GET STOREFRONT BOOTSTRAP BY BRAND OWNER
       ===================================================== */
    @Get(':brandOwnerId')
    getBootstrap(
        @Param('brandOwnerId', new ParseUUIDPipe()) brandOwnerId: string,
    ) {
        return this.storefrontBootstrapService.getBootstrapByBrandOwnerId(
            brandOwnerId,
        );
    }
}