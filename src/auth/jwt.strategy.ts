import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtUser } from './types/jwt-user.type';

@Injectable()
// JwtStrategy validates access tokens for protected routes
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private config: ConfigService) {
        super({
            // Extract JWT from Authorization: Bearer <token>
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            // Reject expired tokens automatically
            ignoreExpiration: false,
            // Use access token secret for verification
            secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
        });
    }

    // Attach validated user data to request object (req.user)
    async validate(payload: any): Promise<JwtUser> {
        return {
            id: payload.sub,
            role: payload.role,
        };
    }
}
