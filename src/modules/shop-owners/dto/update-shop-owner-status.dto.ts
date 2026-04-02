import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateShopOwnerStatusDto {
    @IsBoolean()
    isActive: boolean;

    @IsOptional()
    @IsString()
    notes?: string;
}