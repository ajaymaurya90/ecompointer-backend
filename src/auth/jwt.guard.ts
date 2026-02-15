import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// 🔒 Guard that protects routes using JWT strategy
export class JwtGuard extends AuthGuard('jwt') { }
