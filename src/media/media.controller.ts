import { Controller, Post, Patch, Body, Param } from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@Controller('media')
export class MediaController {
    constructor(private readonly service: MediaService) { }

    @Post()
    create(@Body() dto: CreateMediaDto) {
        return this.service.create(dto);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateMediaDto: UpdateMediaDto,
    ) {
        return this.service.update(id, updateMediaDto);
    }

}
