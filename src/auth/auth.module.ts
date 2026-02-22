import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { JwtGuard } from './jwt.guard';

// AuthModule handles authentication, JWT setup, and related services
@Module({
  imports: [
    // Enables access to environment variables via ConfigService
    ConfigModule,
    // Configure JWT dynamically using environment variables
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  // Registers authentication routes
  controllers: [AuthController],
  // Provides auth logic and JWT validation strategy
  providers: [
    AuthService,
    JwtStrategy,
    JwtGuard,
    RolesGuard,
  ],
  exports: [
    JwtGuard,
    RolesGuard,
  ],
})
export class AuthModule { }
