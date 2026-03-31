import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import type { JwtUser } from 'src/auth/types/jwt-user.type';

import { CreateCustomerGroupDto } from '../dto/group/create-customer-group.dto';
import { UpdateCustomerGroupDto } from '../dto/group/update-customer-group.dto';
import { AddGroupMembersDto } from '../dto/group/add-group-members.dto';

@Injectable()
export class CustomerGroupsService {
    constructor(private prisma: PrismaService) { }

    /* =====================================================
       CREATE GROUP
       ===================================================== */
    async create(dto: CreateCustomerGroupDto, user: JwtUser) {
        const brandOwner = await this.getBrandOwnerProfile(user);

        try {
            return await this.prisma.customerGroup.create({
                data: {
                    brandOwnerId: brandOwner.id,
                    name: dto.name.trim(),
                    description: dto.description?.trim(),
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new BadRequestException(
                    `Customer group "${dto.name}" already exists`,
                );
            }

            throw error;
        }
    }

    /* =====================================================
       FIND ALL
       ===================================================== */
    async findAll(user: JwtUser) {
        const where: Prisma.CustomerGroupWhereInput = {};

        if (user.role === Role.BRAND_OWNER) {
            const brandOwner = await this.getBrandOwnerProfile(user);
            where.brandOwnerId = brandOwner.id;
        } else if (user.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenException('Access denied');
        }

        const groups = await this.prisma.customerGroup.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                translations: true,
                _count: {
                    select: {
                        members: true,
                    },
                },
            },
        });

        return groups.map((group) => ({
            ...group,
            memberCount: group._count.members,
        }));
    }

    /* =====================================================
       FIND ONE
       ===================================================== */
    async findOne(groupId: string, user: JwtUser) {
        const group = await this.prisma.customerGroup.findUnique({
            where: { id: groupId },
            include: {
                translations: true,
                members: {
                    include: {
                        customer: {
                            select: {
                                id: true,
                                customerCode: true,
                                type: true,
                                status: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                                isActive: true,
                            },
                        },
                    },
                },
            },
        });

        if (!group || !group.isActive) {
            throw new NotFoundException('Customer group not found');
        }

        await this.validateGroupAccess(group.brandOwnerId, user, false);

        return group;
    }

    /* =====================================================
       UPDATE GROUP
       ===================================================== */
    async update(groupId: string, dto: UpdateCustomerGroupDto, user: JwtUser) {
        const group = await this.prisma.customerGroup.findUnique({
            where: { id: groupId },
        });

        if (!group || !group.isActive) {
            throw new NotFoundException('Customer group not found');
        }

        await this.validateGroupAccess(group.brandOwnerId, user, true);

        try {
            return await this.prisma.customerGroup.update({
                where: { id: groupId },
                data: {
                    ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
                    ...(dto.description !== undefined
                        ? { description: dto.description?.trim() || null }
                        : {}),
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new BadRequestException(
                    `Customer group "${dto.name}" already exists`,
                );
            }

            throw error;
        }
    }

    /* =====================================================
       DELETE GROUP (SOFT)
       ===================================================== */
    async remove(groupId: string, user: JwtUser) {
        const group = await this.prisma.customerGroup.findUnique({
            where: { id: groupId },
        });

        if (!group || !group.isActive) {
            throw new NotFoundException('Customer group not found');
        }

        await this.validateGroupAccess(group.brandOwnerId, user, true);

        return this.prisma.customerGroup.update({
            where: { id: groupId },
            data: {
                isActive: false,
            },
        });
    }

    /* =====================================================
       ADD MEMBERS
       ===================================================== */
    async addMembers(groupId: string, dto: AddGroupMembersDto, user: JwtUser) {
        const group = await this.prisma.customerGroup.findUnique({
            where: { id: groupId },
        });

        if (!group || !group.isActive) {
            throw new NotFoundException('Customer group not found');
        }

        await this.validateGroupAccess(group.brandOwnerId, user, true);

        const customers = await this.prisma.customer.findMany({
            where: {
                id: { in: dto.customerIds },
                brandOwnerId: group.brandOwnerId,
                isDeleted: false,
            },
            select: { id: true },
        });

        const foundIds = new Set(customers.map((c) => c.id));
        const invalidIds = dto.customerIds.filter((id) => !foundIds.has(id));

        if (invalidIds.length > 0) {
            throw new BadRequestException(
                `Some customers are invalid for this group: ${invalidIds.join(', ')}`,
            );
        }

        await this.prisma.customerGroupMember.createMany({
            data: dto.customerIds.map((customerId) => ({
                customerId,
                customerGroupId: group.id,
            })),
            skipDuplicates: true,
        });

        return this.findOne(group.id, user);
    }

    /* =====================================================
       REMOVE MEMBER
       ===================================================== */
    async removeMember(groupId: string, customerId: string, user: JwtUser) {
        const group = await this.prisma.customerGroup.findUnique({
            where: { id: groupId },
        });

        if (!group || !group.isActive) {
            throw new NotFoundException('Customer group not found');
        }

        await this.validateGroupAccess(group.brandOwnerId, user, true);

        const membership = await this.prisma.customerGroupMember.findFirst({
            where: {
                customerGroupId: groupId,
                customerId,
            },
        });

        if (!membership) {
            throw new NotFoundException('Customer is not a member of this group');
        }

        await this.prisma.customerGroupMember.delete({
            where: { id: membership.id },
        });

        return {
            message: 'Customer removed from group successfully',
        };
    }

    /* =====================================================
       HELPERS
       ===================================================== */

    private async getBrandOwnerProfile(user: JwtUser) {
        if (user.role !== Role.BRAND_OWNER) {
            throw new ForbiddenException('Access denied');
        }

        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { userId: user.id },
        });

        if (!brandOwner) {
            throw new ForbiddenException('BrandOwner profile not found');
        }

        return brandOwner;
    }

    private async validateGroupAccess(
        brandOwnerId: string,
        user: JwtUser,
        requireOwnership: boolean,
    ) {
        if (user.role === Role.SUPER_ADMIN && !requireOwnership) return;

        if (user.role === Role.BRAND_OWNER) {
            const brandOwner = await this.getBrandOwnerProfile(user);

            if (brandOwner.id !== brandOwnerId) {
                throw new ForbiddenException('Access denied');
            }

            return;
        }

        throw new ForbiddenException('Access denied');
    }
}