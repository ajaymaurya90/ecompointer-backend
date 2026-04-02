import { IsOptional, IsString, IsUUID } from 'class-validator';

export class LinkExistingShopOwnerDto {
    @IsOptional()
    @IsUUID()
    shopOwnerId?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    shopSlug?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}