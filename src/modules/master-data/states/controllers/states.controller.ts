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

import { StatesService } from '../services/states.service';
import { CreateStateDto } from '../dto/create-state.dto';
import { UpdateStateDto } from '../dto/update-state.dto';
import { StateQueryDto } from '../dto/state-query.dto';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@ApiTags('States')
@UseGuards(JwtGuard, RolesGuard)
@Controller('master-data/states')
export class StatesController {
    constructor(private readonly statesService: StatesService) { }

    /* =============================
       CREATE
       ============================= */
    @Roles(Role.SUPER_ADMIN)
    @Post()
    create(@Body() dto: CreateStateDto) {
        return this.statesService.create(dto);
    }

    /* =============================
       FIND ONE
       ============================= */
    @Roles(Role.SUPER_ADMIN, Role.BRAND_OWNER)
    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.statesService.findOne(id);
    }

    /* =============================
       FIND ALL
       ============================= */
    @Roles(Role.SUPER_ADMIN, Role.BRAND_OWNER)
    @Get()
    findAll(
        @Query() query: StateQueryDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.statesService.findAll(query, user);
    }

    /* =============================
       UPDATE
       ============================= */
    @Roles(Role.SUPER_ADMIN)
    @Patch(':id')
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateStateDto,
    ) {
        return this.statesService.update(id, dto);
    }

    /* =============================
       DELETE
       ============================= */
    @Roles(Role.SUPER_ADMIN)
    @Delete(':id')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.statesService.remove(id);
    }
}