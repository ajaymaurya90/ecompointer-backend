import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtUser } from 'src/auth/types/jwt-user.type';

import { CustomerGroupsService } from '../services/customer-groups.service';
import { CreateCustomerGroupDto } from '../dto/group/create-customer-group.dto';
import { UpdateCustomerGroupDto } from '../dto/group/update-customer-group.dto';
import { AddGroupMembersDto } from '../dto/group/add-group-members.dto';

@ApiTags('Customer Groups')
@UseGuards(JwtGuard, RolesGuard)
@Controller('customer-groups')
export class CustomerGroupsController {
    constructor(private readonly service: CustomerGroupsService) { }

    @Roles(Role.BRAND_OWNER)
    @Post()
    create(
        @Body() dto: CreateCustomerGroupDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.create(dto, user);
    }

    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN)
    @Get()
    findAll(
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.findAll(user);
    }

    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN)
    @Get(':id')
    findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.findOne(id, user);
    }

    @Roles(Role.BRAND_OWNER)
    @Patch(':id')
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateCustomerGroupDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.update(id, dto, user);
    }

    @Roles(Role.BRAND_OWNER)
    @Delete(':id')
    remove(
        @Param('id', new ParseUUIDPipe()) id: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.remove(id, user);
    }

    @Roles(Role.BRAND_OWNER)
    @Post(':id/members')
    addMembers(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: AddGroupMembersDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.addMembers(id, dto, user);
    }

    @Roles(Role.BRAND_OWNER)
    @Delete(':id/members/:customerId')
    removeMember(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Param('customerId', new ParseUUIDPipe()) customerId: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.removeMember(id, customerId, user);
    }
}