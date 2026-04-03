import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorefrontProductsController } from './controllers/storefront-products.controller';
import { StorefrontProductsService } from './services/storefront-products.service';

@Module({
    imports: [PrismaModule],
    controllers: [StorefrontProductsController],
    providers: [StorefrontProductsService],
    exports: [StorefrontProductsService],
})
export class StorefrontProductsModule { }