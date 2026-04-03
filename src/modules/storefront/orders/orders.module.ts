import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorefrontAuthModule } from '../auth/auth.module';
import { StorefrontOrdersController } from './controllers/storefront-orders.controller';
import { StorefrontOrdersService } from './services/storefront-orders.service';

@Module({
    imports: [PrismaModule, StorefrontAuthModule],
    controllers: [StorefrontOrdersController],
    providers: [StorefrontOrdersService],
    exports: [StorefrontOrdersService],
})
export class StorefrontOrdersModule { }