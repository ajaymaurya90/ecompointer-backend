import { Role } from '@prisma/client';

export class ProfileResponseDto {
    id: string;
    email: string;
    role: Role;

    firstName: string;
    lastName?: string | null;
    phone: string;

    business?: {
        id: string;
        businessName: string;
    } | null;

    createdAt: Date;
}