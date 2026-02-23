import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { CreateRoomDto } from './dto/create-room.dto.js'
import { UpdateRoomDto } from './dto/update-room.dto.js'

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByLocation(locationId: string) {
    return this.prisma.room.findMany({
      where: { locationId },
      orderBy: { name: 'asc' },
    })
  }

  async create(locationId: string, dto: CreateRoomDto, companyId: string, role: string) {
    const location = await this.prisma.location.findUnique({ where: { id: locationId } })
    if (!location) {
      throw new NotFoundException('Location not found')
    }
    if (role !== 'admin' && location.companyId !== companyId) {
      throw new ForbiddenException('Cannot add room to location from another company')
    }

    return this.prisma.room.create({
      data: {
        name: dto.name,
        locationId,
      },
    })
  }

  async update(id: string, dto: UpdateRoomDto, companyId: string, role: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { location: true },
    })
    if (!room) {
      throw new NotFoundException('Room not found')
    }
    if (role !== 'admin' && room.location.companyId !== companyId) {
      throw new ForbiddenException('Cannot update room from another company')
    }

    return this.prisma.room.update({
      where: { id },
      data: { name: dto.name },
    })
  }

  async remove(id: string, companyId: string, role: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { location: true },
    })
    if (!room) {
      throw new NotFoundException('Room not found')
    }
    if (role !== 'admin' && room.location.companyId !== companyId) {
      throw new ForbiddenException('Cannot delete room from another company')
    }

    return this.prisma.room.delete({ where: { id } })
  }
}
