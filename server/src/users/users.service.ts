import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'
import { PrismaService } from '../prisma/prisma.service.js'
import { CreateUserDto } from './dto/create-user.dto.js'
import { UpdateUserDto } from './dto/update-user.dto.js'

function generateOtp(): string {
  return randomBytes(6).toString('base64url')
}

const USER_COLORS = [
  '#1976D2', '#388E3C', '#D32F2F', '#7B1FA2', '#F57C00',
  '#0097A7', '#C2185B', '#512DA8', '#00796B', '#AFB42B',
  '#5D4037', '#455A64', '#E64A19', '#1565C0', '#2E7D32',
]

function randomUserColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, role: string, filterCompanyId?: string) {
    let where: { companyId?: string } = { companyId }
    if (role === 'admin') {
      where = filterCompanyId ? { companyId: filterCompanyId } : {}
    }
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        color: true,
        companyId: true,
        createdAt: true,
        temporaryPassword: true,
        locations: { select: { locationId: true } },
      },
      orderBy: { firstName: 'asc' },
    })
  }

  async invite(dto: CreateUserDto, companyId: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) {
      throw new ConflictException('Email already registered')
    }

    const temporaryPassword = generateOtp()
    const passwordHash = await bcrypt.hash(temporaryPassword, 10)

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        mustChangePassword: true,
        temporaryPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role ?? 'user',
        companyId,
        color: randomUserColor(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        color: true,
        companyId: true,
        createdAt: true,
        temporaryPassword: true,
        locations: { select: { locationId: true } },
      },
    })
  }

  async update(id: string, dto: UpdateUserDto, companyId: string, requestRole: string) {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundException('User not found')
    if (requestRole !== 'admin' && user.companyId !== companyId) {
      throw new ForbiddenException('Cannot update user from another company')
    }
    if (requestRole !== 'admin' && user.role === 'admin') {
      throw new ForbiddenException('Cannot edit an admin user')
    }

    // Prevent removing last super_user
    if (user.role === 'super_user' && dto.role && dto.role !== 'super_user') {
      const superUserCount = await this.prisma.user.count({
        where: { companyId: user.companyId, role: 'super_user' },
      })
      if (superUserCount <= 1) {
        throw new BadRequestException('Cannot remove the last super user')
      }
    }

    const updateData: Record<string, unknown> = {
      ...(dto.firstName !== undefined && { firstName: dto.firstName }),
      ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      ...(dto.role !== undefined && { role: dto.role }),
    }

    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10)
      updateData.mustChangePassword = true
      updateData.temporaryPassword = dto.password
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        createdAt: true,
        locations: { select: { locationId: true } },
      },
    })
  }

  async remove(id: string, requestUserId: string, companyId: string, requestRole: string) {
    if (id === requestUserId) {
      throw new BadRequestException('Cannot delete your own account')
    }

    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundException('User not found')
    if (requestRole !== 'admin' && user.companyId !== companyId) {
      throw new ForbiddenException('Cannot delete user from another company')
    }
    if (requestRole !== 'admin' && user.role === 'admin') {
      throw new ForbiddenException('Cannot delete an admin user')
    }

    if (user.role === 'super_user') {
      const superUserCount = await this.prisma.user.count({
        where: { companyId: user.companyId, role: 'super_user' },
      })
      if (superUserCount <= 1) {
        throw new BadRequestException('Cannot delete the last super user')
      }
    }

    return this.prisma.user.delete({ where: { id } })
  }

  async resetPassword(id: string, companyId: string, requestRole: string) {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundException('User not found')
    if (requestRole !== 'admin' && user.companyId !== companyId) {
      throw new ForbiddenException('Cannot reset password for user from another company')
    }
    if (requestRole !== 'admin' && user.role === 'admin') {
      throw new ForbiddenException('Cannot reset password for an admin user')
    }

    const temporaryPassword = generateOtp()
    const passwordHash = await bcrypt.hash(temporaryPassword, 10)

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true, temporaryPassword },
    })

    return { temporaryPassword }
  }

  async assignLocations(userId: string, locationIds: string[], companyId: string, requestRole: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')
    if (requestRole !== 'admin' && user.companyId !== companyId) {
      throw new ForbiddenException('Cannot assign locations for user from another company')
    }
    if (requestRole !== 'admin' && user.role === 'admin') {
      throw new ForbiddenException('Cannot manage locations for an admin user')
    }

    // Remove existing assignments
    await this.prisma.userLocation.deleteMany({ where: { userId } })

    // Create new assignments
    if (locationIds.length > 0) {
      await this.prisma.userLocation.createMany({
        data: locationIds.map((locationId) => ({ userId, locationId })),
      })
    }

    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        createdAt: true,
        locations: { select: { locationId: true } },
      },
    })
  }
}
