/**
 * ---------------------------------------------------------
 * MEDIA SERVICE
 * ---------------------------------------------------------
 * Primary Responsibilities:
 *
 * 1. Attach media to either:
 *      - Product
 *      - Product Variant
 * 2. Enforce strict ownership rules (cannot belong to both)
 * 3. Maintain exactly ONE primary media per parent
 * 4. Prevent removal of the only primary media
 * 5. Auto-assign primary when none exists
 * 6. Maintain media ordering (sortOrder)
 *
 * Business Rules:
 * - Media must belong to either product OR variant (never both)
 * - Only one active primary media per parent
 * - Cannot disable the only primary image
 * - Soft-state consistency maintained via transactions
 *
 * Designed for scalable e-commerce media management.
 * ---------------------------------------------------------
 */
import { Controller, Post, Patch, Body, Param } from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('media')
@ApiTags('Media')
export class MediaController {
    constructor(private readonly service: MediaService) { }

    @ApiOperation({ summary: 'Create media (product or variant)' })
    @Post()
    create(@Body() dto: CreateMediaDto) {
        return this.service.create(dto);
    }

    @ApiOperation({ summary: 'Update media entry' })
    @ApiParam({ name: 'id', description: 'Media UUID' })
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateMediaDto: UpdateMediaDto,
    ) {
        return this.service.update(id, updateMediaDto);
    }

}
