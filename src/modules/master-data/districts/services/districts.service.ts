import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma, District } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import { CreateDistrictDto } from '../dto/create-district.dto';
import { UpdateDistrictDto } from '../dto/update-district.dto';
import { DistrictQueryDto } from '../dto/district-query.dto';

@Injectable()
export class DistrictsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateDistrictDto): Promise<District> {
        await this.ensureStateExists(dto.stateId);

        const normalizedName = dto.name.trim();

        const existing = await this.prisma.district.findFirst({
            where: {
                stateId: dto.stateId,
                name: {
                    equals: normalizedName,
                    mode: 'insensitive',
                },
            },
            select: { id: true },
        });

        if (existing) {
            throw new ConflictException(
                `District "${normalizedName}" already exists for this state`,
            );
        }

        return this.prisma.district.create({
            data: {
                stateId: dto.stateId,
                name: normalizedName,
                isActive: dto.isActive ?? true,
            },
        });
    }

    async findAll(query: DistrictQueryDto) {
        const where: Prisma.DistrictWhereInput = {};

        if (query.search?.trim()) {
            const search = query.search.trim();

            where.OR = [
                {
                    name: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    state: {
                        name: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    state: {
                        code: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    state: {
                        country: {
                            name: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
                {
                    state: {
                        country: {
                            code: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
            ];
        }

        if (query.stateId) {
            where.stateId = query.stateId;
        }

        if (query.countryId) {
            where.state = {
                countryId: query.countryId,
            };
        }

        if (query.isActive !== undefined) {
            where.isActive = query.isActive === 'true';
        }

        return this.prisma.district.findMany({
            where,
            include: {
                state: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        countryId: true,
                        country: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: [
                { state: { country: { name: 'asc' } } },
                { state: { name: 'asc' } },
                { name: 'asc' },
            ],
        });
    }

    async findOne(id: string) {
        const district = await this.prisma.district.findUnique({
            where: { id },
            include: {
                state: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        countryId: true,
                        country: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!district) {
            throw new NotFoundException('District not found');
        }

        return district;
    }

    async update(id: string, dto: UpdateDistrictDto) {
        const existingDistrict = await this.prisma.district.findUnique({
            where: { id },
            select: {
                id: true,
                stateId: true,
            },
        });

        if (!existingDistrict) {
            throw new NotFoundException('District not found');
        }

        const nextStateId = dto.stateId ?? existingDistrict.stateId;

        if (dto.stateId) {
            await this.ensureStateExists(dto.stateId);
        }

        const nextName =
            dto.name !== undefined ? dto.name.trim() : undefined;

        if (nextName) {
            const duplicate = await this.prisma.district.findFirst({
                where: {
                    stateId: nextStateId,
                    name: {
                        equals: nextName,
                        mode: 'insensitive',
                    },
                    NOT: { id },
                },
                select: { id: true },
            });

            if (duplicate) {
                throw new ConflictException(
                    `District "${nextName}" already exists for this state`,
                );
            }
        }

        const data: Prisma.DistrictUpdateInput = {};

        if (dto.stateId !== undefined) {
            data.state = {
                connect: { id: dto.stateId },
            };
        }

        if (dto.name !== undefined) {
            data.name = dto.name.trim();
        }

        if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
        }

        return this.prisma.district.update({
            where: { id },
            data,
            include: {
                state: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        countryId: true,
                        country: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async remove(id: string): Promise<District> {
        const district = await this.prisma.district.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!district) {
            throw new NotFoundException('District not found');
        }

        try {
            return await this.prisma.district.delete({
                where: { id },
            });
        } catch {
            throw new ConflictException(
                'District cannot be deleted because it is linked to other records',
            );
        }
    }

    private async ensureStateExists(stateId: string): Promise<void> {
        const state = await this.prisma.state.findUnique({
            where: { id: stateId },
            select: { id: true },
        });

        if (!state) {
            throw new NotFoundException('State not found');
        }
    }
}