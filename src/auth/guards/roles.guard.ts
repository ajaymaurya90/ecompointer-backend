import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

@Injectable()
// RolesGuard ensures the authenticated user has required role(s)
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    // Check if the user's role matches any of the required roles for the route 
    canActivate(context: ExecutionContext): boolean {
        // Retrieve roles defined via @Roles() decorator
        // Checks method-level first, then controller-level
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
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
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        // If user is not authenticated, deny access
        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        return requiredRoles.includes(user.role);

    }
}
