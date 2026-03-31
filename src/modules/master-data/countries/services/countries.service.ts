import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma, Country } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCountryDto } from '../dto/create-country.dto';
import { UpdateCountryDto } from '../dto/update-country.dto';
import { CountryQueryDto } from '../dto/country-query.dto';

@Injectable()
export class CountriesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateCountryDto): Promise<Country> {
        const code = dto.code.trim().toUpperCase();
        const name = dto.name.trim();

        const existing = await this.prisma.country.findUnique({
            where: { code },
            select: { id: true },
        });

        if (existing) {
            throw new ConflictException(`Country with code "${code}" already exists`);
        }

        return this.prisma.country.create({
            data: {
                code,
                name,
                phoneCode: dto.phoneCode?.trim() || null,
                currencyCode: dto.currencyCode?.trim().toUpperCase() || null,
                isActive: dto.isActive ?? true,
            },
        });
    }

    async findAll(query: CountryQueryDto): Promise<Country[]> {
        const where: Prisma.CountryWhereInput = {};

        if (query.search?.trim()) {
            const search = query.search.trim();

            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { phoneCode: { contains: search, mode: 'insensitive' } },
                { currencyCode: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (query.isActive !== undefined) {
            where.isActive = query.isActive === 'true';
        }

        return this.prisma.country.findMany({
            where,
            orderBy: [{ name: 'asc' }],
        });
    }

    async findOne(id: string): Promise<Country> {
        const country = await this.prisma.country.findUnique({
            where: { id },
        });

        if (!country) {
            throw new NotFoundException('Country not found');
        }

        return country;
    }

    async update(id: string, dto: UpdateCountryDto): Promise<Country> {
        await this.ensureExists(id);

        const data: Prisma.CountryUpdateInput = {};

        if (dto.code !== undefined) {
            const nextCode = dto.code.trim().toUpperCase();

            const existing = await this.prisma.country.findFirst({
                where: {
                    code: nextCode,
                    NOT: { id },
                },
                select: { id: true },
            });

            if (existing) {
                throw new ConflictException(
                    `Country with code "${nextCode}" already exists`,
                );
            }

            data.code = nextCode;
        }

        if (dto.name !== undefined) {
            data.name = dto.name.trim();
        }

        if (dto.phoneCode !== undefined) {
            data.phoneCode = dto.phoneCode?.trim() || null;
        }

        if (dto.currencyCode !== undefined) {
            data.currencyCode = dto.currencyCode?.trim().toUpperCase() || null;
        }

        if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
        }

        return this.prisma.country.update({
            where: { id },
            data,
        });
    }

    async remove(id: string): Promise<Country> {
        await this.ensureExists(id);

        try {
            return await this.prisma.country.delete({
                where: { id },
            });
        } catch (error) {
            throw new ConflictException(
                'Country cannot be deleted because it is linked to other records',
            );
        }
    }

    private async ensureExists(id: string): Promise<void> {
        const country = await this.prisma.country.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!country) {
            throw new NotFoundException('Country not found');
        }
    }
}