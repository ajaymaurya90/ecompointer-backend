import { IsBoolean } from 'class-validator';

export class UpdateServiceAreaStateDto {
    @IsBoolean()
    isActive!: boolean;
}