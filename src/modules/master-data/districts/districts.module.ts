import { Module } from '@nestjs/common';
import { DistrictsController } from './controllers/districts.controller';
import { DistrictsService } from './services/districts.service';

@Module({
    controllers: [DistrictsController],
    providers: [DistrictsService],
    exports: [DistrictsService],
})
export class DistrictsModule { }