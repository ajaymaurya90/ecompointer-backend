import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorefrontBootstrapModule } from 'src/modules/storefront/bootstrap/bootstrap.module'; // CHANGED: import bootstrap module for cache service access

import { BrandOwnersController } from './controllers/brand-owners.controller';
import { BrandOwnersService } from './services/brand-owners.service';

@Module({
    imports: [
        PrismaModule,
        StorefrontBootstrapModule, // CHANGED: make StorefrontBootstrapCacheService available in this module
    ],
    controllers: [BrandOwnersController],
    providers: [BrandOwnersService],
    exports: [BrandOwnersService],
})
export class BrandOwnersModule { }