import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BrandModule } from './modules/brand/brand.module';
import { ProductCategoryModule } from './product-category/product-category.module';
import { ProductModule } from './product/product.module';
import { ProductVariantModule } from './product-variant/product-variant.module';
import { MediaModule } from './modules/media/media.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CountriesModule } from './modules/master-data/countries/countries.module';
import { StatesModule } from './modules/master-data/states/states.module';
import { DistrictsModule } from './modules/master-data/districts/districts.module';
import { BrandOwnersModule } from './modules/brand-owners/brand-owners.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ShopOwnersModule } from './modules/shop-owners/shop-owners.module';
import { StorefrontModule } from './modules/storefront/storefront.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    BrandModule,
    ProductCategoryModule,
    ProductModule,
    ProductVariantModule,
    CustomersModule,
    MediaModule,
    CountriesModule,
    StatesModule,
    DistrictsModule,
    BrandOwnersModule,
    OrdersModule,
    ShopOwnersModule,
    StorefrontModule
  ],
  controllers: [AppController],
})
export class AppModule { }
