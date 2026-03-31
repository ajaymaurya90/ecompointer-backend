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

import { CountriesService } from '../services/countries.service';
import { CreateCountryDto } from '../dto/create-country.dto';
import { UpdateCountryDto } from '../dto/update-country.dto';
import { CountryQueryDto } from '../dto/country-query.dto';

@ApiTags('Countries')
@UseGuards(JwtGuard, RolesGuard)
@Controller('master-data/countries')
export class CountriesController {
    constructor(private readonly countriesService: CountriesService) { }

    /* =============================
       CREATE
       ============================= */
    @Roles(Role.SUPER_ADMIN)
    @Post()
    create(@Body() dto: CreateCountryDto) {
        return this.countriesService.create(dto);
    }

    /* =============================
       FIND ONE
       ============================= */
    @Roles(Role.SUPER_ADMIN, Role.BRAND_OWNER)
    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.countriesService.findOne(id);
    }

    /* =============================
       FIND ALL
       ============================= */
    @Roles(Role.SUPER_ADMIN, Role.BRAND_OWNER)
    @Get()
    findAll(@Query() query: CountryQueryDto) {
        return this.countriesService.findAll(query);
    }

    /* =============================
       UPDATE
       ============================= */
    @Roles(Role.SUPER_ADMIN)
    @Patch(':id')
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateCountryDto,
    ) {
        return this.countriesService.update(id, dto);
    }

    /* =============================
       DELETE
       ============================= */
    @Roles(Role.SUPER_ADMIN)
    @Delete(':id')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.countriesService.remove(id);
    }
}