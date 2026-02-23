export type JwtUser = {
    id: string;
    role: 'BRAND_OWNER' | 'SHOP_OWNER' | 'SUPER_ADMIN' | 'CUSTOMER';
};