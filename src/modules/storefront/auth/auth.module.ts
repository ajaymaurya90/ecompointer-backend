import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorefrontAuthController } from './controllers/storefront-auth.controller';
import { StorefrontAuthService } from './services/storefront-auth.service';
import { StorefrontCustomerGuard } from './guards/storefront-customer.guard';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'dev_storefront_secret',
            signOptions: {
                expiresIn: (process.env.JWT_EXPIRES_IN as any) || '7d',
            },
        }),
    ],
    controllers: [StorefrontAuthController],
    providers: [StorefrontAuthService, StorefrontCustomerGuard],
    exports: [
        StorefrontAuthService,
        StorefrontCustomerGuard,
        JwtModule,
    ],
})
export class StorefrontAuthModule { }