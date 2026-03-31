import { IsIn, IsString } from 'class-validator';

export class UpdateBrandOwnerLanguageDto {
    @IsString()
    @IsIn(['en', 'de', 'hi'])
    language!: string;
}