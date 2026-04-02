import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ShopOwnersController } from './controllers/shop-owners.controller';
import { ShopOwnerLinksController } from './controllers/shop-owner-links.controller';
import { ShopOwnersService } from './services/shop-owners.service';
import { ShopOwnerLinksService } from './services/shop-owner-links.service';

@Module({
    imports: [PrismaModule],
    controllers: [ShopOwnersController, ShopOwnerLinksController],
    providers: [ShopOwnersService, ShopOwnerLinksService],
    exports: [ShopOwnersService, ShopOwnerLinksService],
})
export class ShopOwnersModule { }