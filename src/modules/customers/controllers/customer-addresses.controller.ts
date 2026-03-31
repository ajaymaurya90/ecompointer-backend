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

import { CustomerAddressesService } from '../services/customer-addresses.service';
import { CreateCustomerAddressDto } from '../dto/address/create-customer-address.dto';
import { UpdateCustomerAddressDto } from '../dto/address/update-customer-address.dto';

@ApiTags('Customer Addresses')
@UseGuards(JwtGuard, RolesGuard)
@Controller('customers/:customerId/addresses')
export class CustomerAddressesController {
    constructor(private readonly service: CustomerAddressesService) { }

    @Roles(Role.BRAND_OWNER)
    @Post()
    create(
        @Param('customerId', new ParseUUIDPipe()) customerId: string,
        @Body() dto: CreateCustomerAddressDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.create(customerId, dto, user);
    }

    @Roles(Role.BRAND_OWNER)
    @Patch(':addressId')
    update(
        @Param('customerId', new ParseUUIDPipe()) customerId: string,
        @Param('addressId', new ParseUUIDPipe()) addressId: string,
        @Body() dto: UpdateCustomerAddressDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.update(customerId, addressId, dto, user);
    }

    @Roles(Role.BRAND_OWNER)
    @Delete(':addressId')
    remove(
        @Param('customerId', new ParseUUIDPipe()) customerId: string,
        @Param('addressId', new ParseUUIDPipe()) addressId: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.remove(customerId, addressId, user);
    }
}