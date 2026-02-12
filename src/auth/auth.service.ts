import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(data: RegisterDto) {
        const existing = await this.prisma.brandOwner.findUnique({
            where: { email: data.email },
        });

        if (existing) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await this.prisma.brandOwner.create({
            data: {
                email: data.email,
                password: hashedPassword,
                brandName: data.brandName,
            },
        });

        return { message: 'Registered successfully', userId: user.id };
    }

    async login(data: LoginDto) {
        const user = await this.prisma.brandOwner.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isValid = await bcrypt.compare(data.password, user.password);

        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = this.jwtService.sign({ userId: user.id });

        return { access_token: token };
    }
}

