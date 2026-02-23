import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service.js'
import { LoginDto } from './dto/login.dto.js'
import { RegisterDto } from './dto/register.dto.js'

const USER_COLORS = [
  '#1976D2', '#388E3C', '#D32F2F', '#7B1FA2', '#F57C00',
  '#0097A7', '#C2185B', '#512DA8', '#00796B', '#AFB42B',
  '#5D4037', '#455A64', '#E64A19', '#1565C0', '#2E7D32',
]

function randomUserColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })
    if (existing) {
      throw new ConflictException('Email already registered')
    }

    const passwordHash = await bcrypt.hash(dto.password, 10)

    let companyId = dto.companyId
    if (!companyId) {
      const company = await this.prisma.company.create({
        data: { name: dto.companyName },
      })
      companyId = company.id
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'super_user',
        companyId,
        color: randomUserColor(),
      },
    })

    return this.generateTokens(user.id, user.email)
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    return this.generateTokens(user.id, user.email)
  }

  async googleLogin(googleUser: { email: string; firstName: string; lastName: string }) {
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    })

    if (!user) {
      const company = await this.prisma.company.create({
        data: { name: `${googleUser.firstName}'s Company` },
      })

      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          companyId: company.id,
          color: randomUserColor(),
        },
      })
    }

    return this.generateTokens(user.id, user.email)
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        color: true,
        weekStartDay: true,
        companyId: true,
        createdAt: true,
        mustChangePassword: true,
        company: {
          select: {
            name: true,
            logo: true,
            color: true,
          },
        },
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return user
  }

  async updateMyProfile(userId: string, data: { firstName?: string; lastName?: string; color?: string; weekStartDay?: number }) {
    const updateData: Record<string, string | number> = {}
    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.color !== undefined) updateData.color = data.color
    if (data.weekStartDay !== undefined) updateData.weekStartDay = data.weekStartDay
    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, firstName: true, lastName: true, color: true, weekStartDay: true },
    })
  }

  async forceChangePassword(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false, temporaryPassword: null },
    })
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found')
    }

    const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!passwordValid) {
      throw new UnauthorizedException('Current password is incorrect')
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, temporaryPassword: null },
    })
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      })

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      })

      if (!user) {
        throw new UnauthorizedException('User not found')
      }

      return this.generateTokens(user.id, user.email)
    } catch {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email }

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    })

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    })

    return { accessToken, refreshToken }
  }
}
