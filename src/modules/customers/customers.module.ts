import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { CustomersController } from './controllers/customers.controller';
import { CustomerBusinessesController } from './controllers/customer-businesses.controller';
import { CustomerAddressesController } from './controllers/customer-addresses.controller';
import { CustomerGroupsController } from './controllers/customer-groups.controller';

import { CustomersService } from './services/customers.service';
import { CustomerBusinessesService } from './services/customer-businesses.service';
import { CustomerAddressesService } from './services/customer-addresses.service';
import { CustomerGroupsService } from './services/customer-groups.service';

@Module({
    controllers: [
        CustomersController,
        CustomerBusinessesController,
        CustomerAddressesController,
        CustomerGroupsController,
    ],
    providers: [
        PrismaService,
        CustomersService,
        CustomerBusinessesService,
        CustomerAddressesService,
        CustomerGroupsService,
    ],
    exports: [
        CustomersService,
        CustomerBusinessesService,
        CustomerAddressesService,
        CustomerGroupsService,
    ],
})
export class CustomersModule { }