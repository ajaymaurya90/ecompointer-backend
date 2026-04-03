import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorefrontBootstrapModule } from './bootstrap/bootstrap.module';
import { StorefrontProductsModule } from './products/products.module';
import { StorefrontCategoriesModule } from './categories/categories.module';
import { StorefrontAuthModule } from './auth/auth.module';
import { StorefrontOrdersModule } from './orders/orders.module';

@Module({
    imports: [
        PrismaModule,
        StorefrontBootstrapModule,
        StorefrontProductsModule,
        StorefrontCategoriesModule,
        StorefrontAuthModule,
        StorefrontOrdersModule,
    ],
})
export class StorefrontModule { }