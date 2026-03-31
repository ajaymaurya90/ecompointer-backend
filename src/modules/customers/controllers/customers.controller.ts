import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
    Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtUser } from 'src/auth/types/jwt-user.type';

import { CustomersService } from '../services/customers.service';
import { CreateCustomerDto } from '../dto/customer/create-customer.dto';
import { UpdateCustomerDto } from '../dto/customer/update-customer.dto';
import { CustomerQueryDto } from '../dto/customer/customer-query.dto';

@ApiTags('Customers')
@UseGuards(JwtGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
    constructor(private readonly service: CustomersService) { }

    /* =============================
       CREATE
       ============================= */
    @Roles(Role.BRAND_OWNER)
    @Post()
    create(
        @Body() dto: CreateCustomerDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.create(dto, user);
    }

    /* =============================
       FIND ONE
       ============================= */
    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN)
    @Get(':id')
    findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.findOne(id, user);
    }

    /* =============================
       FIND ALL
       ============================= */
    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN)
    @Get()
    findAll(
        @CurrentUser() user: JwtUser,
        @Query() query: CustomerQueryDto,
    ) {
        return this.service.findAll(user, query);
    }

    /* =============================
       UPDATE
       ============================= */
    @Roles(Role.BRAND_OWNER)
    @Patch(':id')
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateCustomerDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.update(id, dto, user);
    }

    /* =============================
       ARCHIVE
       ============================= */
    @Roles(Role.BRAND_OWNER)
    @Patch(':id/archive')
    archive(
        @Param('id', new ParseUUIDPipe()) id: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.archive(id, user);
    }
}