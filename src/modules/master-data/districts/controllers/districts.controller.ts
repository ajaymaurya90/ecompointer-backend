import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

import { DistrictsService } from '../services/districts.service';
import { CreateDistrictDto } from '../dto/create-district.dto';
import { UpdateDistrictDto } from '../dto/update-district.dto';
import { DistrictQueryDto } from '../dto/district-query.dto';

@ApiTags('Districts')
@UseGuards(JwtGuard, RolesGuard)
@Controller('master-data/districts')
export class DistrictsController {
    constructor(private readonly districtsService: DistrictsService) { }

    /* =============================
       CREATE
       ============================= */
    @Roles(Role.SUPER_ADMIN)
    @Post()
    create(@Body() dto: CreateDistrictDto) {
        return this.districtsService.create(dto);
    }

    /* =============================
       FIND ONE
       ============================= */
    @Roles(Role.SUPER_ADMIN, Role.BRAND_OWNER)
    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.districtsService.findOne(id);
    }

    /* =============================
       FIND ALL
       ============================= */
    @Roles(Role.SUPER_ADMIN, Role.BRAND_OWNER)
    @Get()
    findAll(@Query() query: DistrictQueryDto) {
        return this.districtsService.findAll(query);
    }

    /* =============================
       UPDATE
       ============================= */
    @Roles(Role.SUPER_ADMIN)
    @Patch(':id')
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateDistrictDto,
    ) {
        return this.districtsService.update(id, dto);
    }

    /* =============================
       DELETE
       ============================= */
    @Roles(Role.SUPER_ADMIN)
    @Delete(':id')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.districtsService.remove(id);
    }
}