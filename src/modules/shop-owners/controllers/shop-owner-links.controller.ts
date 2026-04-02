import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
import { LinkExistingShopOwnerDto } from '../dto/link-existing-shop-owner.dto';
import { ShopOwnerLinksService } from '../services/shop-owner-links.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('shop-owners')
export class ShopOwnerLinksController {
    constructor(private readonly shopOwnerLinksService: ShopOwnerLinksService) { }

    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN)
    @Post('link-existing')
    linkExisting(
        @Body() dto: LinkExistingShopOwnerDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.shopOwnerLinksService.linkExisting(dto, user);
    }
}