/**
 * ============================================================
 * MEDIA CONTROLLER
 * ============================================================
 * Responsibilities:
 * - Secure media operations (JWT protected)
 * - Handle media CRUD
 * - Handle image uploads (local storage for development)
 * - Delegate business logic to MediaService
 *
 * Architecture Notes:
 * - URLs do NOT expose internal IDs
 * - Files stored using random UUID names
 * - Ownership validation handled in service layer
 * - CDN-ready URL structure
 * ============================================================
 */

import {
    Controller,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Get,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiParam,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/types/jwt-user.type';

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('media')
export class MediaController {
    constructor(private readonly service: MediaService) { }

    @ApiOperation({ summary: 'Create media (product or variant)' })
    @Post()
    create(
        @CurrentUser() user: JwtUser,
        @Body() dto: CreateMediaDto,
    ) {
        return this.service.create(dto, user.id);
    }

    @ApiOperation({ summary: 'Update media entry' })
    @ApiParam({ name: 'id', description: 'Media UUID' })
    @Patch(':id')
    update(
        @Param('id') id: string,
        @CurrentUser() user: JwtUser,
        @Body() dto: UpdateMediaDto,
    ) {
        return this.service.update(id, dto, user.id);
    }

    @ApiOperation({ summary: 'Soft delete media entry' })
    @ApiParam({ name: 'id', description: 'Media UUID' })
    @Delete(':id')
    remove(
        @Param('id') id: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.remove(id, user.id);
    }

    @ApiOperation({ summary: 'Get product media (ordered)' })
    @ApiParam({ name: 'id', description: 'Product UUID' })
    @Get('product/:id')
    getProductMedia(
        @Param('id') productId: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.getProductMedia(productId, user.id);
    }

    @ApiOperation({ summary: 'Get variant media (ordered)' })
    @ApiParam({ name: 'id', description: 'Variant UUID' })
    @Get('variant/:id')
    getVariantMedia(
        @Param('id') variantId: string,
        @CurrentUser() user: JwtUser,
    ) {
        return this.service.getVariantMedia(variantId, user.id);
    }

    @ApiOperation({ summary: 'Upload product image' })
    @ApiParam({ name: 'productId', description: 'Product UUID' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @Post('upload/product/:productId')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const uploadPath = `uploads/media`;
                    require('fs').mkdirSync(uploadPath, { recursive: true });
                    cb(null, uploadPath);
                },
                filename: (req, file, cb) => {
                    const uniqueName =
                        uuid().replace(/-/g, '') +
                        extname(file.originalname).toLowerCase();
                    cb(null, uniqueName);
                },
            }),
            limits: {
                fileSize: 5 * 1024 * 1024,
            },
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.startsWith('image/')) {
                    return cb(
                        new BadRequestException('Only image files are allowed'),
                        false,
                    );
                }
                cb(null, true);
            },
        }),
    )
    async uploadProductImage(
        @UploadedFile() file: Express.Multer.File,
        @Param('productId') productId: string,
        @CurrentUser() user: JwtUser,
    ) {
        if (!file) {
            throw new BadRequestException('File not uploaded');
        }

        const url = `/uploads/media/${file.filename}`;

        return this.service.create(
            {
                productId,
                url,
                type: 'GALLERY',
                mimeType: file.mimetype,
                size: file.size,
            },
            user.id,
        );
    }

    @ApiOperation({ summary: 'Upload variant image' })
    @ApiParam({ name: 'variantId', description: 'Variant UUID' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @Post('upload/variant/:variantId')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const uploadPath = `uploads/media`;
                    require('fs').mkdirSync(uploadPath, { recursive: true });
                    cb(null, uploadPath);
                },
                filename: (req, file, cb) => {
                    const uniqueName =
                        uuid().replace(/-/g, '') +
                        extname(file.originalname).toLowerCase();
                    cb(null, uniqueName);
                },
            }),
            limits: {
                fileSize: 5 * 1024 * 1024,
            },
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.startsWith('image/')) {
                    return cb(
                        new BadRequestException('Only image files are allowed'),
                        false,
                    );
                }
                cb(null, true);
            },
        }),
    )
    async uploadVariantImage(
        @UploadedFile() file: Express.Multer.File,
        @Param('variantId') variantId: string,
        @CurrentUser() user: JwtUser,
    ) {
        if (!file) {
            throw new BadRequestException('File not uploaded');
        }

        const url = `/uploads/media/${file.filename}`;

        return this.service.create(
            {
                variantId,
                url,
                type: 'GALLERY',
                mimeType: file.mimetype,
                size: file.size,
            },
            user.id,
        );
    }
}