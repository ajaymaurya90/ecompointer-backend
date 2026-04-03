import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * ---------------------------------------------------------
 * CURRENT STOREFRONT CUSTOMER DECORATOR
 * ---------------------------------------------------------
 * Purpose:
 * Extracts the authenticated storefront customer payload
 * from the request object after StorefrontCustomerGuard
 * has validated the bearer token.
 * ---------------------------------------------------------
 */
export const CurrentStorefrontCustomer = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);