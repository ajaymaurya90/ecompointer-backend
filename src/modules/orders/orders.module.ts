import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrdersController } from './controllers/orders.controller';
import { OrderPaymentsController } from './controllers/order-payments.controller';
import { OrderStatusController } from './controllers/order-status.controller';
import { OrdersService } from './services/orders.service';
import { OrderPaymentsService } from './services/order-payments.service';
import { OrderStatusService } from './services/order-status.service';

@Module({
    imports: [PrismaModule],
    controllers: [
        OrdersController,
        OrderPaymentsController,
        OrderStatusController,
    ],
    providers: [
        OrdersService,
        OrderPaymentsService,
        OrderStatusService,
    ],
    exports: [
        OrdersService,
        OrderPaymentsService,
        OrderStatusService,
    ],
})
export class OrdersModule { }