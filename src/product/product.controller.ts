/**
 * ---------------------------------------------------------
 * PRODUCT CONTROLLER
 * ---------------------------------------------------------
 * Primary Responsibilities:
 *
 * 1. Expose REST API endpoints for product operations
 * 2. Handle request parameter parsing & validation
 * 3. Delegate business logic to ProductService
 * 4. Validate UUID parameters using ParseUUIDPipe
 * 5. Support pagination & optional brand filtering
 *
 * Routes:
 * POST    /products            → Create product
 * GET     /products/:id        → Get single product (with relations)
 * GET     /products            → Paginated product list
 * PATCH   /products/:id        → Update product
 * DELETE  /products/:id        → Soft delete product
 *
 * Notes:
 * - Owner validation temporarily disabled (planned for auth integration)
 * - Controller remains thin (no business logic here)
 * ---------------------------------------------------------
 */
import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    ParseUUIDPipe,
    Query,
    Patch,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtGuard } from 'src/auth/jwt.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtUser } from 'src/auth/types/jwt-user.type';

@UseGuards(JwtGuard, RolesGuard)
@Controller('products')
@ApiTags('Products')
export class ProductController {
    constructor(private readonly service: ProductService) { }

    /* =============================
       CREATE
       ============================= */
    @Roles(Role.BRAND_OWNER)
    @Post()
    create(
        @Body() dto: CreateProductDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.create(dto, user);
    }

    /* =============================
       FIND ONE
       ============================= */
    @Roles(Role.BRAND_OWNER, Role.SHOP_OWNER, Role.SUPER_ADMIN)
    @Get(':id')
    findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.findOne(id, user);
    }

    /* =============================
       FIND ALL (Paginated)
       ============================= */
    @Roles(Role.BRAND_OWNER, Role.SHOP_OWNER, Role.SUPER_ADMIN)
    @Get()
    findAll(
        @CurrentUser() user: JwtUser,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('categoryId') categoryId?: string,
        @Query('sortBy') sortBy?: string,
        @Query('order') order?: 'asc' | 'desc',
    ) {
        return this.service.findAll(
            user,
            Number(page) || 1,
            Number(limit) || 10,
            { search, categoryId, sortBy, order },
        );
    }

    /* =============================
       UPDATE
       ============================= */
    @Roles(Role.BRAND_OWNER)
    @Patch(':id')
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateProductDto,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.update(id, dto, user);
    }

    /* =============================
       DELETE
       ============================= */
    @Roles(Role.BRAND_OWNER)
    @Delete(':id')
    remove(
        @Param('id', new ParseUUIDPipe()) id: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.remove(id, user);
    }
}