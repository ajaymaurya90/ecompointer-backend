import {
    IsArray,
    IsBoolean,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
    ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VariantGeneratorAttributeDto {
    @ApiProperty({
        example: 'Size',
        description: 'Attribute name',
    })
    @IsString()
    name: string;

    @ApiProperty({
        example: ['S', 'M', 'L'],
        description: 'Attribute values',
        type: [String],
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    values: string[];
}

export class GenerateProductVariantsDto {
    @ApiProperty({
        type: [VariantGeneratorAttributeDto],
        description: 'Attributes and values used to generate combinations',
        example: [
            { name: 'Size', values: ['S', 'M', 'L'] },
            { name: 'Color', values: ['Red', 'Blue'] },
            { name: 'Fabric', values: ['Cotton', 'Linen'] },
        ],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => VariantGeneratorAttributeDto)
    attributes: VariantGeneratorAttributeDto[];

    @ApiProperty({
        example: 18,
        description: 'Tax rate percentage',
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    taxRate: number;

    @ApiProperty({
        example: 500,
        description: 'Cost price',
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    costPrice: number;

    @ApiProperty({
        example: 700,
        description: 'Wholesale net price',
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    wholesaleNet: number;

    @ApiProperty({
        example: 1000,
        description: 'Retail net price',
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    retailNet: number;

    @ApiProperty({
        example: 50,
        description: 'Initial stock for each generated variant',
    })
    @Type(() => Number)
    @IsInt()
    @Min(0)
    stock: number;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether generated variants are active',
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}