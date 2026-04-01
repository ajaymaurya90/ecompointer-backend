import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, State, Role } from '@prisma/client';

import { CreateStateDto } from '../dto/create-state.dto';
import { UpdateStateDto } from '../dto/update-state.dto';
import { StateQueryDto } from '../dto/state-query.dto';
import type { JwtUser } from 'src/auth/types/jwt-user.type';

@Injectable()
export class StatesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateStateDto): Promise<State> {
        await this.ensureCountryExists(dto.countryId);

        const normalizedName = dto.name.trim();
        const normalizedCode = dto.code?.trim().toUpperCase() || null;

        const existing = await this.prisma.state.findFirst({
            where: {
                countryId: dto.countryId,
                name: {
                    equals: normalizedName,
                    mode: 'insensitive',
                },
            },
            select: { id: true },
        });

        if (existing) {
            throw new ConflictException(
                `State "${normalizedName}" already exists for this country`,
            );
        }

        return this.prisma.state.create({
            data: {
                countryId: dto.countryId,
                name: normalizedName,
                code: normalizedCode,
                isActive: dto.isActive ?? true,
            },
        });
    }

    async findAll(query: StateQueryDto, user?: JwtUser) {
        const where: Prisma.StateWhereInput = {};

        if (query.search?.trim()) {
            const search = query.search.trim();

            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { country: { name: { contains: search, mode: 'insensitive' } } },
                { country: { code: { contains: search, mode: 'insensitive' } } },
            ];
        }

        if (query.countryId) {
            where.countryId = query.countryId;
        }

        if (query.isActive !== undefined) {
            where.isActive = query.isActive === 'true';
        }

        const states = await this.prisma.state.findMany({
            where,
            include: {
                country: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
            orderBy: [
                { country: { name: 'asc' } },
                { name: 'asc' },
            ],
        });

        // Apply Service Area filtering only for BRAND_OWNER
        if (!user || user.role !== Role.BRAND_OWNER) {
            return states;
        }

        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { userId: user.id },
            select: { id: true },
        });

        if (!brandOwner) return states;

        const overrides = await this.prisma.brandOwnerState.findMany({
            where: { brandOwnerId: brandOwner.id },
            select: { stateId: true, isActive: true },
        });

        const overrideMap = new Map(
            overrides.map((o) => [o.stateId, o.isActive])
        );

        // Remove states explicitly disabled by Brand Owner
        return states.filter((state) => {
            const override = overrideMap.get(state.id);
            return override !== false;
        });
    }

    async findOne(id: string) {
        const state = await this.prisma.state.findUnique({
            where: { id },
            include: {
                country: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });

        if (!state) {
            throw new NotFoundException('State not found');
        }

        return state;
    }

    async update(id: string, dto: UpdateStateDto) {
        const existingState = await this.prisma.state.findUnique({
            where: { id },
            select: {
                id: true,
                countryId: true,
            },
        });

        if (!existingState) {
            throw new NotFoundException('State not found');
        }

        const nextCountryId = dto.countryId ?? existingState.countryId;

        if (dto.countryId) {
            await this.ensureCountryExists(dto.countryId);
        }

        const nextName =
            dto.name !== undefined ? dto.name.trim() : undefined;

        if (nextName) {
            const duplicate = await this.prisma.state.findFirst({
                where: {
                    countryId: nextCountryId,
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
                    `State "${nextName}" already exists for this country`,
                );
            }
        }

        const data: Prisma.StateUpdateInput = {};

        if (dto.countryId !== undefined) {
            data.country = { connect: { id: dto.countryId } };
        }

        if (dto.name !== undefined) {
            data.name = dto.name.trim();
        }

        if (dto.code !== undefined) {
            data.code = dto.code?.trim().toUpperCase() || null;
        }

        if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
        }

        return this.prisma.state.update({
            where: { id },
            data,
            include: {
                country: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });
    }

    async remove(id: string): Promise<State> {
        const state = await this.prisma.state.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!state) {
            throw new NotFoundException('State not found');
        }

        try {
            return await this.prisma.state.delete({
                where: { id },
            });
        } catch {
            throw new ConflictException(
                'State cannot be deleted because it is linked to other records',
            );
        }
    }

    private async ensureCountryExists(countryId: string): Promise<void> {
        const country = await this.prisma.country.findUnique({
            where: { id: countryId },
            select: { id: true },
        });

        if (!country) {
            throw new NotFoundException('Country not found');
        }
    }
}