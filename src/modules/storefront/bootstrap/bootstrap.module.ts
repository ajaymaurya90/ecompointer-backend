import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorefrontBootstrapController } from './controllers/storefront-bootstrap.controller';
import { StorefrontBootstrapService } from './services/storefront-bootstrap.service';

@Module({
    imports: [PrismaModule],
    controllers: [StorefrontBootstrapController],
    providers: [StorefrontBootstrapService],
    exports: [StorefrontBootstrapService],
})
export class StorefrontBootstrapModule { }