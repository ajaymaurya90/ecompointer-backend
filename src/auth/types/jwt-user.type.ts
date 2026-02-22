export type JwtUser = {
    id: string;
    email: string;
    role: 'USER' | 'ADMIN' | 'BRAND_OWNER' | 'SHOP_OWNER' | 'SUPER_ADMIN' | 'CUSTOMER';
};