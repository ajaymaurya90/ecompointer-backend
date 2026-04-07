import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Patch,
    Delete,
    Param,
    ParseUUIDPipe,
    Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductCategoryService } from '../services/product-category.service';
import { CreateProductCategoryDto } from '../dto/create-product-category.dto';
import { UpdateProductCategoryDto } from '../dto/update-product-category.dto';
import { JwtGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import type { JwtUser } from 'src/auth/types/jwt-user.type';

@ApiTags('Product Categories')
@UseGuards(JwtGuard, RolesGuard)
@Controller('categories')
export class ProductCategoryController {
    constructor(private readonly service: ProductCategoryService) { }

    /* =====================================================
       CREATE (BrandOwner only)
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Post()
    create(
        @Body() dto: CreateProductCategoryDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.create(dto, user);
    }

    /* =====================================================
       GET MY CATEGORIES
       ===================================================== */
    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN, Role.SHOP_OWNER)
    @Get()
    findMyCategories(@CurrentUser() user: JwtUser) {
        return this.service.findMyCategories(user);
    }

    /* =====================================================
       GET CATEGORY PRODUCTS
       ===================================================== */
    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN, Role.SHOP_OWNER)
    @Get(':id/products')
    findCategoryProducts(
        @Param('id', new ParseUUIDPipe()) id: string,
        @CurrentUser() user: JwtUser,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.service.findCategoryProducts(
            id,
            user,
            Number(page) || 1,
            Number(limit) || 10,
        );
    }

    /* =====================================================
       GET ASSIGNABLE PRODUCTS FOR CATEGORY
       ===================================================== */
    @Roles(Role.BRAND_OWNER, Role.SUPER_ADMIN, Role.SHOP_OWNER)
    @Get(':id/product-options')
    findAssignableProducts(
        @Param('id', new ParseUUIDPipe()) id: string,
        @CurrentUser() user: JwtUser,
        @Query('search') search?: string,
    ) {
        return this.service.findAssignableProducts(id, user, search);
    }

    /* =====================================================
       ASSIGN PRODUCTS TO CATEGORY
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Post(':id/assign-products')
    assignProducts(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() body: { productIds: string[] },
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.assignProductsToCategory(id, body.productIds, user);
    }

    /* =====================================================
       REMOVE PRODUCT ASSIGNMENT FROM CATEGORY
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Delete(':id/assigned-products/:productId')
    removeAssignedProduct(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Param('productId', new ParseUUIDPipe()) productId: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.removeProductAssignment(id, productId, user);
    }

    /* =====================================================
       UPDATE (BrandOwner only)
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Patch(':id')
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateProductCategoryDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.update(id, dto, user);
    }

    /* =====================================================
       DELETE (BrandOwner only)
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Delete(':id')
    remove(
        @Param('id', new ParseUUIDPipe()) id: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.remove(id, user);
    }

    /* =====================================================
       REORDER CATEGORIES (BrandOwner only)
       ===================================================== */
    @Roles(Role.BRAND_OWNER)
    @Post('reorder')
    reorderCategories(
        @Body() payload: { id: string; parentId: string | null; position: number }[],
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.reorder(payload, user);
    }
}