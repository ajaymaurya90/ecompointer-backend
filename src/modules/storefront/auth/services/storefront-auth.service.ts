import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CustomerSource, CustomerStatus, CustomerType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorefrontRegisterDto } from '../dto/storefront-register.dto';
import { StorefrontLoginDto } from '../dto/storefront-login.dto';
import { StorefrontCustomerJwt } from '../interfaces/storefront-customer-jwt.interface';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StorefrontAuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    /* =====================================================
       REGISTER STOREFRONT CUSTOMER
       ===================================================== */
    async register(
        brandOwnerId: string,
        dto: StorefrontRegisterDto,
    ) {
        // Ensure the brand owner storefront is active and registration is allowed.
        await this.assertStorefrontRegistrationAvailable(brandOwnerId);

        // Normalize email to avoid duplicate accounts caused by casing differences.
        const email = dto.email.trim().toLowerCase();

        // Block registration when login credentials already exist for this BO + email.
        const existingAuth = await this.prisma.customerAuth.findUnique({
            where: {
                brandOwnerId_email: {
                    brandOwnerId,
                    email,
                },
            },
            select: {
                id: true,
            },
        });

        if (existingAuth) {
            throw new ConflictException(
                'A customer account already exists for this email on this storefront',
            );
        }

        // Check whether a guest or manually created customer already exists under this BO.
        const existingCustomer = await this.prisma.customer.findFirst({
            where: {
                brandOwnerId,
                email,
                isDeleted: false,
            },
            include: {
                auth: true,
            },
        });

        // Hash customer password before storing login credentials.
        const passwordHash = await bcrypt.hash(dto.password, 10);

        // Create auth for existing customer or create both customer and auth together.
        const customer = await this.prisma.$transaction(async (tx) => {
            if (existingCustomer) {
                // Prevent linking auth when that customer is already auth-enabled.
                if (existingCustomer.auth) {
                    throw new ConflictException(
                        'A customer account already exists for this email on this storefront',
                    );
                }

                await tx.customerAuth.create({
                    data: {
                        customerId: existingCustomer.id,
                        brandOwnerId,
                        email,
                        passwordHash,
                    },
                });

                return tx.customer.findUniqueOrThrow({
                    where: { id: existingCustomer.id },
                    select: {
                        id: true,
                        customerCode: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        brandOwnerId: true,
                        type: true,
                        status: true,
                    },
                });
            }

            // Generate the next customer code for this brand owner.
            const customerCode = await this.generateCustomerCode(brandOwnerId);

            const createdCustomer = await tx.customer.create({
                data: {
                    customerCode,
                    brandOwnerId,
                    type: CustomerType.INDIVIDUAL,
                    status: CustomerStatus.ACTIVE,
                    source: CustomerSource.WEBSITE,
                    firstName: dto.firstName.trim(),
                    lastName: dto.lastName?.trim() || null,
                    email,
                    phone: dto.phone?.trim() || null,
                    auth: {
                        create: {
                            brandOwnerId,
                            email,
                            passwordHash,
                        },
                    },
                },
                select: {
                    id: true,
                    customerCode: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    brandOwnerId: true,
                    type: true,
                    status: true,
                },
            });

            return createdCustomer;
        });

        return {
            message: 'Storefront customer registered successfully',
            data: customer,
        };
    }

    /* =====================================================
       LOGIN STOREFRONT CUSTOMER
       ===================================================== */
    async login(
        brandOwnerId: string,
        dto: StorefrontLoginDto,
    ) {
        // Ensure the brand owner storefront is active before login.
        await this.assertStorefrontLoginAvailable(brandOwnerId);

        // Normalize email before looking up customer auth record.
        const email = dto.email.trim().toLowerCase();

        // Load auth credentials together with linked customer record.
        const customerAuth = await this.prisma.customerAuth.findUnique({
            where: {
                brandOwnerId_email: {
                    brandOwnerId,
                    email,
                },
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        customerCode: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        brandOwnerId: true,
                        type: true,
                        status: true,
                        isActive: true,
                        isDeleted: true,
                    },
                },
            },
        });

        // Stop when storefront login credentials do not exist.
        if (!customerAuth) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Stop when the storefront customer auth record is disabled.
        if (!customerAuth.isActive) {
            throw new UnauthorizedException('Customer account is inactive');
        }

        // Stop when the linked customer record is deleted or inactive.
        if (
            !customerAuth.customer ||
            customerAuth.customer.isDeleted ||
            !customerAuth.customer.isActive
        ) {
            throw new UnauthorizedException('Customer account is inactive');
        }

        // Compare submitted password against stored password hash.
        const isPasswordValid = await bcrypt.compare(
            dto.password,
            customerAuth.passwordHash,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Build storefront-customer JWT payload scoped to this BO.
        const payload: StorefrontCustomerJwt = {
            sub: customerAuth.customer.id,
            customerId: customerAuth.customer.id,
            brandOwnerId: customerAuth.brandOwnerId,
            email: customerAuth.email,
            type: 'storefront_customer',
        };

        // Sign customer access token for storefront account usage.
        const accessToken = await this.jwtService.signAsync(payload);

        return {
            message: 'Storefront customer login successful',
            accessToken,
            data: {
                customer: {
                    id: customerAuth.customer.id,
                    customerCode: customerAuth.customer.customerCode,
                    firstName: customerAuth.customer.firstName,
                    lastName: customerAuth.customer.lastName,
                    email: customerAuth.customer.email,
                    phone: customerAuth.customer.phone,
                    brandOwnerId: customerAuth.customer.brandOwnerId,
                    type: customerAuth.customer.type,
                    status: customerAuth.customer.status,
                },
            },
        };
    }

    /* =====================================================
       GET CURRENT STOREFRONT CUSTOMER PROFILE
       ===================================================== */
    async me(customerJwt: StorefrontCustomerJwt) {
        // Load the currently authenticated storefront customer in BO scope.
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: customerJwt.customerId,
                brandOwnerId: customerJwt.brandOwnerId,
                isDeleted: false,
                isActive: true,
            },
            include: {
                addresses: {
                    where: {
                        isActive: true,
                    },
                    orderBy: [
                        { isDefault: 'desc' },
                        { createdAt: 'asc' },
                    ],
                    select: {
                        id: true,
                        type: true,
                        fullName: true,
                        phone: true,
                        addressLine1: true,
                        addressLine2: true,
                        landmark: true,
                        city: true,
                        district: true,
                        state: true,
                        country: true,
                        postalCode: true,
                        isDefault: true,
                    },
                },
                businesses: {
                    where: {
                        isActive: true,
                    },
                    orderBy: [
                        { isPrimary: 'desc' },
                        { createdAt: 'asc' },
                    ],
                    select: {
                        id: true,
                        businessName: true,
                        legalBusinessName: true,
                        businessType: true,
                        contactPersonName: true,
                        contactPersonPhone: true,
                        contactPersonEmail: true,
                        gstNumber: true,
                        website: true,
                        isPrimary: true,
                    },
                },
            },
        });

        // Stop when customer is no longer available or active.
        if (!customer) {
            throw new UnauthorizedException('Customer account not found');
        }

        return {
            message: 'Storefront customer profile fetched successfully',
            data: customer,
        };
    }

    /* =====================================================
       HELPERS
       ===================================================== */
    private async assertStorefrontRegistrationAvailable(brandOwnerId: string) {
        // Load BO storefront flags to validate public registration access.
        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { id: brandOwnerId },
            select: {
                id: true,
                isActive: true,
                storefrontSetting: {
                    select: {
                        isStorefrontEnabled: true,
                        isCustomerRegistrationEnabled: true,
                    },
                },
            },
        });

        // Stop when BO/storefront does not exist.
        if (!brandOwner) {
            throw new NotFoundException('Storefront not found');
        }

        // Stop when brand owner itself is inactive.
        if (!brandOwner.isActive) {
            throw new BadRequestException('Storefront is not available');
        }

        // Stop when storefront has been disabled by BO.
        if (brandOwner.storefrontSetting?.isStorefrontEnabled === false) {
            throw new BadRequestException('Storefront is disabled');
        }

        // Stop when customer registration is disabled for this storefront.
        if (
            brandOwner.storefrontSetting?.isCustomerRegistrationEnabled === false
        ) {
            throw new BadRequestException(
                'Customer registration is disabled for this storefront',
            );
        }
    }

    private async assertStorefrontLoginAvailable(brandOwnerId: string) {
        // Load BO storefront state before allowing storefront login.
        const brandOwner = await this.prisma.brandOwner.findUnique({
            where: { id: brandOwnerId },
            select: {
                id: true,
                isActive: true,
                storefrontSetting: {
                    select: {
                        isStorefrontEnabled: true,
                    },
                },
            },
        });

        // Stop when BO/storefront does not exist.
        if (!brandOwner) {
            throw new NotFoundException('Storefront not found');
        }

        // Stop when brand owner itself is inactive.
        if (!brandOwner.isActive) {
            throw new BadRequestException('Storefront is not available');
        }

        // Stop when storefront has been disabled by BO.
        if (brandOwner.storefrontSetting?.isStorefrontEnabled === false) {
            throw new BadRequestException('Storefront is disabled');
        }
    }

    private async generateCustomerCode(brandOwnerId: string) {
        // Count current customers under BO to generate next readable customer code.
        const totalCustomers = await this.prisma.customer.count({
            where: {
                brandOwnerId,
            },
        });

        const nextNumber = totalCustomers + 1;
        return `CUST-${String(nextNumber).padStart(5, '0')}`;
    }
}