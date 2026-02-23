import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { CreateBookingDto } from './dto/create-booking.dto.js'

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserBookings(userId: string, start?: string, end?: string) {
    const where: Record<string, unknown> = { userId }
    if (start && end) {
      where.startTime = { gte: new Date(start) }
      where.endTime = { lte: new Date(end) }
    }
    return this.prisma.booking.findMany({
      where,
      include: { room: true, user: { select: { id: true, firstName: true, lastName: true, color: true } } },
      orderBy: { startTime: 'asc' },
    })
  }

  async getRoomBookings(roomId: string, start: string, end: string) {
    return this.prisma.booking.findMany({
      where: {
        roomId,
        startTime: { lt: new Date(end) },
        endTime: { gt: new Date(start) },
      },
      include: { user: { select: { id: true, firstName: true, lastName: true, color: true } } },
      orderBy: { startTime: 'asc' },
    })
  }

  async getLocationBookings(locationId: string, start: string, end: string) {
    return this.prisma.booking.findMany({
      where: {
        room: { locationId },
        startTime: { lt: new Date(end) },
        endTime: { gt: new Date(start) },
      },
      include: {
        room: true,
        user: { select: { id: true, firstName: true, lastName: true, color: true } },
      },
      orderBy: { startTime: 'asc' },
    })
  }

  async create(dto: CreateBookingDto, userId: string) {
    const startTime = new Date(dto.startTime)
    const endTime = new Date(dto.endTime)

    this.validateBookingTimes(startTime, endTime)

    // Verify room exists and get location info
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
      include: { location: true },
    })
    if (!room) {
      throw new NotFoundException('Room not found')
    }

    if (dto.isRecurring) {
      return this.createRecurringBooking(dto, userId, startTime, endTime)
    }

    // Check single booking conflict
    await this.checkConflict(dto.roomId, startTime, endTime)

    return this.prisma.booking.create({
      data: {
        roomId: dto.roomId,
        userId,
        startTime,
        endTime,
        isRecurring: false,
      },
      include: {
        room: true,
        user: { select: { id: true, firstName: true, lastName: true, color: true } },
      },
    })
  }

  async remove(id: string, userId: string, role: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { childBookings: true },
    })
    if (!booking) {
      throw new NotFoundException('Booking not found')
    }
    if (booking.userId !== userId && role === 'user') {
      throw new ForbiddenException('Cannot delete another user\'s booking')
    }

    return this.prisma.booking.delete({ where: { id } })
  }

  async removeRecurringFromDate(parentId: string, fromDate: string, userId: string, role: string) {
    const parent = await this.prisma.booking.findUnique({ where: { id: parentId } })
    if (!parent) {
      throw new NotFoundException('Parent booking not found')
    }
    if (parent.userId !== userId && role === 'user') {
      throw new ForbiddenException('Cannot delete another user\'s bookings')
    }

    const cancelDate = new Date(fromDate)

    // Delete future occurrences
    const deleted = await this.prisma.booking.deleteMany({
      where: {
        OR: [
          { id: parentId, startTime: { gte: cancelDate } },
          { parentBookingId: parentId, startTime: { gte: cancelDate } },
        ],
      },
    })

    // Set recurrenceEndDate on the parent if it still exists (wasn't deleted)
    const parentStillExists = await this.prisma.booking.findUnique({ where: { id: parentId } })
    if (parentStillExists) {
      await this.prisma.booking.update({
        where: { id: parentId },
        data: { recurrenceEndDate: cancelDate },
      })
    }

    return { deletedCount: deleted.count }
  }

  private validateBookingTimes(startTime: Date, endTime: Date) {
    const now = new Date()
    if (startTime <= now) {
      throw new BadRequestException('Start time must be in the future')
    }
    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time')
    }
    const durationMs = endTime.getTime() - startTime.getTime()
    const fifteenMinutes = 15 * 60 * 1000
    if (durationMs < fifteenMinutes) {
      throw new BadRequestException('Minimum booking duration is 15 minutes')
    }
  }

  private async checkConflict(roomId: string, startTime: Date, endTime: Date, excludeId?: string) {
    const where: Record<string, unknown> = {
      roomId,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    }
    if (excludeId) {
      where.id = { not: excludeId }
    }

    const conflict = await this.prisma.booking.findFirst({
      where,
      include: { user: { select: { firstName: true, lastName: true } } },
    })

    if (conflict) {
      throw new ConflictException({
        message: 'Conflicting booking exists',
        conflict: {
          id: conflict.id,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          bookedBy: `${conflict.user.firstName} ${conflict.user.lastName}`,
        },
      })
    }
  }

  private async createRecurringBooking(
    dto: CreateBookingDto,
    userId: string,
    startTime: Date,
    endTime: Date,
  ) {
    // Recurring is always weekly; generate 1 year of occurrences if no end date
    const recurrenceEndDate = dto.recurrenceEndDate
      ? new Date(dto.recurrenceEndDate)
      : new Date(startTime.getTime() + 365 * 24 * 60 * 60 * 1000)

    if (recurrenceEndDate <= startTime) {
      throw new BadRequestException('Recurrence end date must be after start date')
    }

    const pattern = dto.recurrencePattern ?? 'weekly'

    // Generate all occurrence dates
    const occurrences = this.generateOccurrences(
      startTime,
      endTime,
      pattern,
      recurrenceEndDate,
    )

    // Check conflicts for all occurrences
    for (const occurrence of occurrences) {
      await this.checkConflict(dto.roomId, occurrence.start, occurrence.end)
    }

    // Create parent booking (first occurrence) — no recurrenceEndDate stored unless cancelled later
    const parent = await this.prisma.booking.create({
      data: {
        roomId: dto.roomId,
        userId,
        startTime: occurrences[0].start,
        endTime: occurrences[0].end,
        isRecurring: true,
        recurrencePattern: pattern,
      },
    })

    // Create child bookings (remaining occurrences)
    if (occurrences.length > 1) {
      await this.prisma.booking.createMany({
        data: occurrences.slice(1).map((occ) => ({
          roomId: dto.roomId,
          userId,
          startTime: occ.start,
          endTime: occ.end,
          isRecurring: true,
          recurrencePattern: pattern,
          parentBookingId: parent.id,
        })),
      })
    }

    // Return parent with children
    return this.prisma.booking.findUnique({
      where: { id: parent.id },
      include: {
        room: true,
        user: { select: { id: true, firstName: true, lastName: true, color: true } },
        childBookings: true,
      },
    })
  }

  private generateOccurrences(
    startTime: Date,
    endTime: Date,
    pattern: string,
    recurrenceEndDate: Date,
  ): Array<{ start: Date; end: Date }> {
    const occurrences: Array<{ start: Date; end: Date }> = []
    const durationMs = endTime.getTime() - startTime.getTime()

    let currentStart = new Date(startTime)

    while (currentStart <= recurrenceEndDate) {
      occurrences.push({
        start: new Date(currentStart),
        end: new Date(currentStart.getTime() + durationMs),
      })

      switch (pattern) {
        case 'daily':
          currentStart.setDate(currentStart.getDate() + 1)
          break
        case 'weekly':
          currentStart.setDate(currentStart.getDate() + 7)
          break
        case 'monthly':
          currentStart.setMonth(currentStart.getMonth() + 1)
          break
      }
    }

    return occurrences
  }
}
