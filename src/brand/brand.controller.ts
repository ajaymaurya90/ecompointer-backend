import { Controller, Post, Body, UseGuards, Get, } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/types/jwt-user.type';
import { Param, Patch, Delete } from '@nestjs/common';
import { UpdateBrandDto } from './dto/update-brand.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('brand')
export class BrandController {
    constructor(private readonly brandService: BrandService) { }

    @Post()
    create(
        @Body() data: CreateBrandDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.brandService.create(data, user.id);
    }

    @Get()
    findMyBrands(@CurrentUser() user: JwtUser) {
        return this.brandService.findMyBrands(user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: JwtUser,) {
        return this.brandService.findOne(id, user.id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: UpdateBrandDto, @CurrentUser() user: JwtUser,) {
        return this.brandService.update(id, data, user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: JwtUser,) {
        return this.brandService.remove(id, user.id);
    }
}
