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
 * 
 * TODO:
 * - Auto convert images to WebP
 * - Multiimage upload support
 * - Generate thumbnails automatically
 * - Create StorageService abstraction (local vs S3 switch)
 * ============================================================
 */

import {
    Controller,
    Post,
    Patch,
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

import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('media')
export class MediaController {
    constructor(private readonly service: MediaService) { }

    /**
     * ------------------------------------------------------------
     * Create media entry manually (URL-based)
     * ------------------------------------------------------------
     */
    @ApiOperation({ summary: 'Create media (product or variant)' })
    @Post()
    create(
        @CurrentUser() user: any,
        @Body() dto: CreateMediaDto,
    ) {
        return this.service.create(dto, user.id);
    }

    /**
     * ------------------------------------------------------------
     * Update media metadata
     * ------------------------------------------------------------
     */
    @ApiOperation({ summary: 'Update media entry' })
    @ApiParam({ name: 'id', description: 'Media UUID' })
    @Patch(':id')
    update(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() dto: UpdateMediaDto,
    ) {
        return this.service.update(id, dto, user.id);
    }

    /**
     * ------------------------------------------------------------
     * Get all media for a product (ordered)
     * ------------------------------------------------------------
     */
    @ApiOperation({ summary: 'Get product media (ordered)' })
    @ApiParam({ name: 'id', description: 'Product UUID' })
    @Get('product/:id')
    getProductMedia(
        @Param('id') productId: string,
        @CurrentUser() user: any,
    ) {
        return this.service.getProductMedia(productId, user.id);
    }

    /**
     * ------------------------------------------------------------
     * Get all media for a variant (ordered)
     * ------------------------------------------------------------
     */
    @ApiOperation({ summary: 'Get variant media (ordered)' })
    @ApiParam({ name: 'id', description: 'Variant UUID' })
    @Get('variant/:id')
    getVariantMedia(
        @Param('id') variantId: string,
        @CurrentUser() user: any,
    ) {
        return this.service.getVariantMedia(variantId, user.id);
    }

    /**
     * ------------------------------------------------------------
     * Upload product image (Industry-style implementation)
     * ------------------------------------------------------------
     * - Stores files in /uploads/media
     * - Uses random UUID filenames
     * - Does NOT expose userId/productId in URL
     * - Validates file type & size
     * - Creates Media DB record automatically
     * ------------------------------------------------------------
     */
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
                fileSize: 5 * 1024 * 1024, // 5MB limit
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
        @CurrentUser() user: any,
    ) {
        if (!file) {
            throw new BadRequestException('File not uploaded');
        }

        // Public URL (CDN-ready structure)
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
}