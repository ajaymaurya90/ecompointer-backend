export type JwtUser = {
    id: string;
    email: string;
    role: 'USER' | 'ADMIN';
};