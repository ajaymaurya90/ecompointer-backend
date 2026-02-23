import {
    Controller,
    Post,
    Body,
    UseGuards,
    Get,
    Param,
    Patch,
    Delete,
} from '@nestjs/common';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtGuard } from '../auth/jwt.guard';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/types/jwt-user.type';

@UseGuards(JwtGuard, RolesGuard)
@Controller('brand')
export class BrandController {
    constructor(private readonly brandService: BrandService) { }

    // Only BrandOwner can create
    @Roles(Role.BRAND_OWNER)
    @Post()
    create(
        @Body() dto: CreateBrandDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.brandService.create(dto, user);
    }

    // BrandOwner sees his brands
    // SuperAdmin sees all
    // ShopOwner sees associated (future)
    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN, Role.SHOP_OWNER)
    @Get()
    findBrands(@CurrentUser() user: JwtUser) {
        return this.brandService.findBrands(user);
    }

    // BrandOwner can see his brand
    // SuperAdmin can see any
    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN)
    @Get(':id')
    findOne(
        @Param('id') id: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.brandService.findOne(id, user);
    }

    // Only BrandOwner can update his brand
    @Roles(Role.BRAND_OWNER)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateBrandDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.brandService.update(id, dto, user);
    }

    // Only BrandOwner can delete his brand
    @Roles(Role.BRAND_OWNER)
    @Delete(':id')
    remove(
        @Param('id') id: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.brandService.remove(id, user);
    }
}