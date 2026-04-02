import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
import { CreateShopOwnerDto } from '../dto/create-shop-owner.dto';
import { ShopOwnerQueryDto } from '../dto/shop-owner-query.dto';
import { UpdateShopOwnerDto } from '../dto/update-shop-owner.dto';
import { UpdateShopOwnerStatusDto } from '../dto/update-shop-owner-status.dto';
import { ShopOwnersService } from '../services/shop-owners.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('shop-owners')
export class ShopOwnersController {
    constructor(private readonly shopOwnersService: ShopOwnersService) { }

    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN)
    @Post()
    create(
        @Body() dto: CreateShopOwnerDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.shopOwnersService.create(dto, user);
    }

    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN)
    @Get()
    findAll(
        @Query() query: ShopOwnerQueryDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.shopOwnersService.findAll(query, user);
    }

    @Roles(Role.BRAND_OWNER, Role.SHOP_OWNER, Role.SUPER_ADMIN)
    @Get(':id')
    findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.shopOwnersService.findOne(id, user);
    }

    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN)
    @Patch(':id')
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateShopOwnerDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.shopOwnersService.update(id, dto, user);
    }

    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN)
    @Patch(':id/status')
    updateStatus(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateShopOwnerStatusDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.shopOwnersService.updateStatus(id, dto, user);
    }

    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN)
    @Get('order-search/list')
    orderSearch(
        @Query('search') search: string | undefined,
        @CurrentUser() user: JwtUser,
    ) {
        return this.shopOwnersService.orderSearch(search, user);
    }
}