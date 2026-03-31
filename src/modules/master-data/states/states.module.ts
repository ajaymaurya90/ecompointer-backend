import { Module } from '@nestjs/common';
import { StatesController } from './controllers/states.controller';
import { StatesService } from './services/states.service';

@Module({
    controllers: [StatesController],
    providers: [StatesService],
    exports: [StatesService],
})
export class StatesModule { }