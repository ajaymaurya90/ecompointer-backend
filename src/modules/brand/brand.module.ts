import { Module } from '@nestjs/common';
import { BrandService } from './services/brand.service';
import { BrandController } from './controllers/brand.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [BrandController],
  providers: [BrandService, PrismaService],
})
export class BrandModule { }

