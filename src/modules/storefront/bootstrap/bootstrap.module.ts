import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorefrontBootstrapController } from './controllers/storefront-bootstrap.controller';
import { StorefrontBootstrapService } from './services/storefront-bootstrap.service';
import { StorefrontBootstrapCacheService } from './services/storefront-bootstrap-cache.service';

@Module({
    imports: [PrismaModule],
    controllers: [StorefrontBootstrapController],
    providers: [
        StorefrontBootstrapService,
        StorefrontBootstrapCacheService,
    ],
    exports: [
        StorefrontBootstrapService,
        StorefrontBootstrapCacheService,
    ],
})
export class StorefrontBootstrapModule { }