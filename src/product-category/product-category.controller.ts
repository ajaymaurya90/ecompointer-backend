import {
    Controller,
    Post,
    Body,
    Get,
    Query,
    BadRequestException,
    UseGuards,
    Patch,
    Delete,
    Param,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiQuery,
} from '@nestjs/swagger';
import { ProductCategoryService } from './product-category.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { JwtGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
import { ReorderCategoryDto } from './dto/reorder-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';

@ApiTags('Product Categories')
@UseGuards(JwtGuard, RolesGuard)
@Controller('categories')
export class ProductCategoryController {
    constructor(private readonly service: ProductCategoryService) { }

    /*
     =============================
     CREATE (BrandOwner only)
     =============================
    */
    @Roles(Role.BRAND_OWNER)
    @Post()
    create(
        @Body() dto: CreateProductCategoryDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.create(dto, user);
    }

    /*
     =============================
     GET by Brand
     =============================
    */
    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN, Role.SHOP_OWNER)
    @Get()
    findMyCategories(
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.findMyCategories(user);
    }

    /*
     =============================
     UPDATE (BrandOwner only)
     =============================
    */
    @Roles(Role.BRAND_OWNER)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateProductCategoryDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.update(id, dto, user);
    }

    /*
     =============================
     DELETE (BrandOwner only)
     =============================
    */
    @Roles(Role.BRAND_OWNER)
    @Delete(':id')
    remove(
        @Param('id') id: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.remove(id, user);
    }

    /**
 * Reorder categories (BrandOwner only)
 */
    @Roles(Role.BRAND_OWNER)
    @Post('reorder')
    async reorderCategories(
        @Body() payload: { id: string; parentId: string | null; position: number }[],
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.reorder(payload, user);
    }
}


