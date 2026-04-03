import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateBrandOwnerShopOrderRulesDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    minShopOrderLineQty?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    minShopOrderCartQty?: number;

    @IsOptional()
    @IsBoolean()
    allowBelowMinLineQtyAfterCartMin?: boolean;
}