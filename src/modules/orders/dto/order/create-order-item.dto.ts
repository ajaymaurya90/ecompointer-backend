import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateOrderItemDto {
    @IsUUID()
    productVariantId: string;

    @IsInt()
    @Min(1)
    quantity: number;

    // Optional line note reserved for future use like special packing instructions.
    @IsOptional()
    @IsString()
    note?: string;
}