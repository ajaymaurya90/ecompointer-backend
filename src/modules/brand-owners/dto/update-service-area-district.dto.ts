import { IsBoolean } from 'class-validator';

export class UpdateServiceAreaDistrictDto {
    @IsBoolean()
    isActive!: boolean;
}