import { Module } from '@nestjs/common';

import { BrandOwnersController } from './controllers/brand-owners.controller';
import { BrandOwnersService } from './services/brand-owners.service';

@Module({
    controllers: [BrandOwnersController],
    providers: [BrandOwnersService],
    exports: [BrandOwnersService],
})
export class BrandOwnersModule { }