import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    CustomerSource,
    CustomerStatus,
    CustomerType,
    Prisma,
    Role,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import type { JwtUser } from 'src/auth/types/jwt-user.type';

import { CreateCustomerDto } from '../dto/customer/create-customer.dto';
import { UpdateCustomerDto } from '../dto/customer/update-customer.dto';
import { CustomerQueryDto } from '../dto/customer/customer-query.dto';

@Injectable()
export class CustomersService {
    constructor(private prisma: PrismaService) { }

    /* =====================================================
       CREATE CUSTOMER
       ===================================================== */
    async create(dto: CreateCustomerDto, user: JwtUser) {
        const brandOwner = await this.getBrandOwnerProfile(user);
        const customerCode = await this.generateCustomerCode(brandOwner.id);

        return this.prisma.customer.create({
            data: {
                customerCode,
                brandOwnerId: brandOwner.id,
                type: dto.type ?? CustomerType.INDIVIDUAL,
                status: dto.status ?? CustomerStatus.ACTIVE,
                source: dto.source ?? CustomerSource.MANUAL,
                firstName: dto.firstName.trim(),
                lastName: dto.lastName?.trim(),
                email: dto.email?.trim().toLowerCase(),
                phone: dto.phone?.trim(),
                alternatePhone: dto.alternatePhone?.trim(),
                dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
                notes: dto.notes?.trim(),
            },
        });
    }

    /* =====================================================
       FIND ONE
       ===================================================== */
    async findOne(customerId: string, user: JwtUser) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                brandOwner: {
                    select: {
                        id: true,
                        businessName: true,
                    },
                },
                businesses: {
                    where: { isActive: true },
                    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
                    include: {
                        shopOwner: {
                            select: {
                                id: true,
                                shopName: true,
                                ownerName: true,
                                shopSlug: true,
                            },
                        },
                    },
                },
                addresses: {
                    where: { isActive: true },
                    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
                    include: {
                        countryRef: true,
                        stateRef: true,
                        districtRef: true,
                    },
                },
                groupMembers: {
                    include: {
                        customerGroup: {
                            include: {
                                translations: true,
                            },
                        },
                    },
                },
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        orderNumber: true,
                        salesChannel: true,
                        status: true,
                        paymentStatus: true,
                        totalAmount: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!customer || customer.isDeleted) {
            throw new NotFoundException('Customer not found');
        }

        await this.validateCustomerAccess(customer.brandOwnerId, user, false);

        return customer;
    }

    /* =====================================================
       FIND ALL
       ===================================================== */
    async findAll(user: JwtUser, query: CustomerQueryDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const where: Prisma.CustomerWhereInput = {
            isDeleted: false,
        };

        if (user.role === Role.BRAND_OWNER) {
            const brandOwner = await this.getBrandOwnerProfile(user);
            where.brandOwnerId = brandOwner.id;
        }

        if (user.role === Role.SUPER_ADMIN) {
            // no additional tenant filter
        }

        if (query.type) {
            where.type = query.type;
        }

        if (query.status) {
            where.status = query.status;
        }

        if (query.source) {
            where.source = query.source;
        }

        if (query.search) {
            where.OR = [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search, mode: 'insensitive' } },
                { customerCode: { contains: query.search, mode: 'insensitive' } },
                {
                    businesses: {
                        some: {
                            businessName: {
                                contains: query.search,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
            ];
        }

        const allowedSortFields = [
            'createdAt',
            'updatedAt',
            'firstName',
            'customerCode',
            'status',
            'type',
        ];

        const sortBy = allowedSortFields.includes(query.sortBy || '')
            ? query.sortBy!
            : 'createdAt';

        const order = query.sortOrder === 'asc' ? 'asc' : 'desc';

        const [customers, total] = await this.prisma.$transaction([
            this.prisma.customer.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: order },
                include: {
                    businesses: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            businessName: true,
                            businessType: true,
                            isPrimary: true,
                        },
                    },
                    groupMembers: {
                        include: {
                            customerGroup: {
                                select: {
                                    id: true,
                                    name: true,
                                    description: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.customer.count({ where }),
        ]);

        return {
            data: customers,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    /* =====================================================
       UPDATE CUSTOMER
       ===================================================== */
    async update(customerId: string, dto: UpdateCustomerDto, user: JwtUser) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });

        if (!customer || customer.isDeleted) {
            throw new NotFoundException('Customer not found');
        }

        await this.validateCustomerAccess(customer.brandOwnerId, user, true);

        return this.prisma.customer.update({
            where: { id: customerId },
            data: {
                ...(dto.type !== undefined ? { type: dto.type } : {}),
                ...(dto.status !== undefined ? { status: dto.status } : {}),
                ...(dto.source !== undefined ? { source: dto.source } : {}),
                ...(dto.firstName !== undefined ? { firstName: dto.firstName.trim() } : {}),
                ...(dto.lastName !== undefined ? { lastName: dto.lastName?.trim() || null } : {}),
                ...(dto.email !== undefined
                    ? { email: dto.email?.trim().toLowerCase() || null }
                    : {}),
                ...(dto.phone !== undefined ? { phone: dto.phone?.trim() || null } : {}),
                ...(dto.alternatePhone !== undefined
                    ? { alternatePhone: dto.alternatePhone?.trim() || null }
                    : {}),
                ...(dto.dateOfBirth !== undefined
                    ? { dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null }
                    : {}),
                ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
            },
        });
    }

    /* =====================================================
       ARCHIVE CUSTOMER
       ===================================================== */
    async archive(customerId: string, user: JwtUser) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });

        if (!customer || customer.isDeleted) {
            throw new NotFoundException('Customer not found');
        }

        await this.validateCustomerAccess(customer.brandOwnerId, user, true);

        return this.prisma.customer.update({
            where: { id: customerId },
            data: {
                isActive: false,
                isDeleted: true,
                deletedAt: new Date(),
            },
        });
    }

    /* =====================================================
       HELPERS
       ===================================================== */

    private async getBrandOwnerProfile(user: JwtUser) {
        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { userId: user.id },
        });

        if (!brandOwner) {
            throw new ForbiddenException('BrandOwner profile not found');
        }

        return brandOwner;
    }

    private async validateCustomerAccess(
        brandOwnerId: string,
        user: JwtUser,
        requireOwnership: boolean,
    ) {
        if (user.role === Role.SUPER_ADMIN) return;

        if (user.role === Role.BRAND_OWNER) {
            const brandOwner = await this.getBrandOwnerProfile(user);

            if (brandOwner.id !== brandOwnerId) {
                throw new ForbiddenException('Access denied');
            }

            return;
        }

        if (user.role === Role.SHOP_OWNER) {
            // Current schema does not make ShopOwner the owner of Customer.
            // ShopOwner can be linked via CustomerBusiness, but customer records
            // themselves remain BrandOwner-owned.
            throw new ForbiddenException('Access denied');
        }

        throw new ForbiddenException('Access denied');
    }

    private async generateCustomerCode(brandOwnerId: string) {
        const count = await this.prisma.customer.count({
            where: { brandOwnerId },
        });

        const nextNumber = count + 1;

        return `CUST-${String(nextNumber).padStart(5, '0')}`;
    }
}