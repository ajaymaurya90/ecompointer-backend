import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorefrontCategoriesController } from './controllers/storefront-categories.controller';
import { StorefrontCategoriesService } from './services/storefront-categories.service';

@Module({
    imports: [PrismaModule],
    controllers: [StorefrontCategoriesController],
    providers: [StorefrontCategoriesService],
    exports: [StorefrontCategoriesService],
})
export class StorefrontCategoriesModule { }