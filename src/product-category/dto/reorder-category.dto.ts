import { IsOptional, IsUUID } from "class-validator";

export class ReorderCategoryDto {

    @IsUUID()
    id: string;

    @IsOptional()
    @IsUUID()
    parentId?: string | null;

    position: number;
}