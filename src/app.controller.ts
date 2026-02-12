import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private prisma: PrismaService
  ) { }

  @Get()
  async testDb() {
    return {
      status: 'DB Connected',
      brandOwners: await this.prisma.brandOwner.count(),
    }
  }

  @Get()
  healthCheck() {
    return { status: 'OK' };
  }
}
