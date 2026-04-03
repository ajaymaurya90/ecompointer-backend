import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { StorefrontCustomerJwt } from '../interfaces/storefront-customer-jwt.interface';

/**
 * ---------------------------------------------------------
 * STOREFRONT CUSTOMER GUARD
 * ---------------------------------------------------------
 * Purpose:
 * Validates storefront customer bearer tokens and attaches
 * the decoded storefront customer payload to request.user.
 *
 * Expected Authorization header:
 * Bearer <accessToken>
 * ---------------------------------------------------------
 */
@Injectable()
export class StorefrontCustomerGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) { }

    // Validate storefront customer access token before protected route access.
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractBearerToken(request);

        if (!token) {
            throw new UnauthorizedException('Missing storefront access token');
        }

        try {
            // Verify and decode JWT token using the configured storefront secret.
            const payload =
                await this.jwtService.verifyAsync<StorefrontCustomerJwt>(token, {
                    secret: process.env.JWT_SECRET || 'dev_storefront_secret',
                });

            // Ensure only storefront-customer tokens are accepted by this guard.
            if (payload.type !== 'storefront_customer') {
                throw new UnauthorizedException('Invalid storefront token');
            }

            // Attach decoded payload for downstream controllers/services.
            (request as Request & { user?: StorefrontCustomerJwt }).user = payload;

            return true;
        } catch {
            throw new UnauthorizedException('Invalid or expired storefront access token');
        }
    }

    // Read bearer token from Authorization header.
    private extractBearerToken(request: Request): string | null {
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            return null;
        }

        const [scheme, token] = authHeader.split(' ');

        if (scheme !== 'Bearer' || !token) {
            return null;
        }

        return token;
    }
}