import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // 1) Register + 2) hash password
  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      email: dto.email,
      name: dto.name,
      password: hashed,
    });
    return { id: user.id, email: user.email, name: user.name };
  }

  // 3) Login + 4) receive tokens
  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user.id, user.email);
  }

  // 6) Refresh tokens (rotation: old refresh token stops working)
  async refresh(refreshToken: string) {
    let payload: { sub: number; email: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.refreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.users.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access denied');
    }
    if (sha256(refreshToken) !== user.refreshTokenHash) {
      throw new UnauthorizedException('Access denied');
    }

    return this.issueTokens(user.id, user.email);
  }

  // 7) Logout: remove the stored refresh token hash
  async logout(userId: number) {
    await this.users.setRefreshTokenHash(userId, null);
    return { message: 'Logged out successfully' };
  }

  private async issueTokens(userId: number, email: string) {
    const payload = { sub: userId, email };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET') || 'dev-access-secret',
      expiresIn: Number(this.config.get('JWT_ACCESS_EXPIRES_IN') || 900),
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.refreshSecret(),
      expiresIn: Number(this.config.get('JWT_REFRESH_EXPIRES_IN') || 604800),
      jwtid: randomUUID(), // unique per token, so rotation always invalidates the old one
    });

    // Store only a hash of the refresh token.
    // SHA-256 (not bcrypt): bcrypt ignores everything after 72 bytes, which would
    // make different JWTs look identical.
    await this.users.setRefreshTokenHash(userId, sha256(refreshToken));

    return { accessToken, refreshToken };
  }

  private refreshSecret() {
    return this.config.get<string>('JWT_REFRESH_SECRET') || 'dev-refresh-secret';
  }
}
