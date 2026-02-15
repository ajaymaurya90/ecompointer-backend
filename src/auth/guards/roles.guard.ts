import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
// RolesGuard ensures the authenticated user has required role(s)
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    // Check if the user's role matches any of the required roles for the route 
    canActivate(context: ExecutionContext): boolean {
        // Retrieve roles defined via @Roles() decorator
        // Checks method-level first, then controller-level
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY,
            [
                context.getHandler(),   // method
                context.getClass(),     // controller
            ],
        );

        // If no roles are defined, allow access
        if (!requiredRoles) {
            return true;
        }

        // Extract user from request (attached by JwtStrategy)
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // If user's role is not in required roles → deny access
        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException('Access denied');
        }

        return true;
    }
}
