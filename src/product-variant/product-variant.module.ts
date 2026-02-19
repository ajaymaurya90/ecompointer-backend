import { Module } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';
import { ProductVariantController } from './product-variant.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ProductVariantController],
  providers: [ProductVariantService, PrismaService],
})
export class ProductVariantModule { }
