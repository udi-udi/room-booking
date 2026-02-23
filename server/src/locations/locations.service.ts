import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { CreateLocationDto } from './dto/create-location.dto.js'
import { UpdateLocationDto } from './dto/update-location.dto.js'

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string, role: string, companyId: string) {
    if (role === 'admin') {
      return this.prisma.location.findMany({
        where: { companyId },
        include: { rooms: true, _count: { select: { rooms: true } } },
        orderBy: { name: 'asc' },
      })
    }

    if (role === 'super_user') {
      return this.prisma.location.findMany({
        where: { companyId },
        include: { rooms: true, _count: { select: { rooms: true } } },
        orderBy: { name: 'asc' },
      })
    }

    return this.prisma.location.findMany({
      where: {
        users: { some: { userId } },
      },
      include: { rooms: true, _count: { select: { rooms: true } } },
      orderBy: { name: 'asc' },
    })
  }

  async create(dto: CreateLocationDto, companyId: string) {
    return this.prisma.location.create({
      data: {
        name: dto.name,
        companyId,
      },
      include: { rooms: true },
    })
  }

  async update(id: string, dto: UpdateLocationDto, companyId: string, role: string) {
    const location = await this.prisma.location.findUnique({ where: { id } })
    if (!location) {
      throw new NotFoundException('Location not found')
    }
    if (role !== 'admin' && location.companyId !== companyId) {
      throw new ForbiddenException('Cannot update location from another company')
    }

    return this.prisma.location.update({
      where: { id },
      data: { name: dto.name },
      include: { rooms: true },
    })
  }

  async getLocationUsers(locationId: string) {
    const location = await this.prisma.location.findUnique({ where: { id: locationId } })
    if (!location) {
      throw new NotFoundException('Location not found')
    }

    // Return all users in the company (this endpoint is guarded to super_user/admin)
    return this.prisma.user.findMany({
      where: { companyId: location.companyId },
      select: { id: true, firstName: true, lastName: true, color: true },
      orderBy: { firstName: 'asc' },
    })
  }

  async remove(id: string, companyId: string, role: string) {
    const location = await this.prisma.location.findUnique({ where: { id } })
    if (!location) {
      throw new NotFoundException('Location not found')
    }
    if (role !== 'admin' && location.companyId !== companyId) {
      throw new ForbiddenException('Cannot delete location from another company')
    }

    return this.prisma.location.delete({ where: { id } })
  }
}
