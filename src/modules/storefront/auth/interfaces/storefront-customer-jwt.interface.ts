export interface StorefrontCustomerJwt {
    sub: string;
    customerId: string;
    brandOwnerId: string;
    email: string;
    type: 'storefront_customer';
}