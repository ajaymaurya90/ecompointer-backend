import { Module } from '@nestjs/common';
import { CountriesController } from './controllers/countries.controller';
import { CountriesService } from './services/countries.service';

@Module({
    controllers: [CountriesController],
    providers: [CountriesService],
    exports: [CountriesService],
})
export class CountriesModule { }