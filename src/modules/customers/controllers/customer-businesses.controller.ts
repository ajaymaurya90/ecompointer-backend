import {
    Body,
    Controller,
    Delete,
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

import { CustomerBusinessesService } from '../services/customer-businesses.service';
import { CreateCustomerBusinessDto } from '../dto/business/create-customer-business.dto';
import { UpdateCustomerBusinessDto } from '../dto/business/update-customer-business.dto';

@ApiTags('Customer Businesses')
@UseGuards(JwtGuard, RolesGuard)
@Controller('customers/:customerId/businesses')
export class CustomerBusinessesController {
    constructor(private readonly service: CustomerBusinessesService) { }

    @Roles(Role.BRAND_OWNER)
    @Post()
    create(
        @Param('customerId', new ParseUUIDPipe()) customerId: string,
        @Body() dto: CreateCustomerBusinessDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.create(customerId, dto, user);
    }

    @Roles(Role.BRAND_OWNER)
    @Patch(':businessId')
    update(
        @Param('customerId', new ParseUUIDPipe()) customerId: string,
        @Param('businessId', new ParseUUIDPipe()) businessId: string,
        @Body() dto: UpdateCustomerBusinessDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.update(customerId, businessId, dto, user);
    }

    @Roles(Role.BRAND_OWNER)
    @Delete(':businessId')
    remove(
        @Param('customerId', new ParseUUIDPipe()) customerId: string,
        @Param('businessId', new ParseUUIDPipe()) businessId: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.remove(customerId, businessId, user);
    }
}