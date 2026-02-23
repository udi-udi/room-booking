import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllCompanies() {
    return this.prisma.company.findMany({
      include: {
        _count: { select: { users: true, locations: true } },
      },
      orderBy: { name: 'asc' },
    })
  }

  async createCompany(name: string) {
    return this.prisma.company.create({
      data: { name },
      include: {
        _count: { select: { users: true, locations: true } },
      },
    })
  }

  async deleteCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } })
    if (!company) throw new NotFoundException('Company not found')

    // Cascading delete: bookings → rooms → locations → user_locations → users → company
    // Delete all bookings for rooms in this company's locations
    await this.prisma.booking.deleteMany({
      where: { room: { location: { companyId } } },
    })
    // Delete all rooms in this company's locations
    await this.prisma.room.deleteMany({
      where: { location: { companyId } },
    })
    // Delete all user-location assignments for this company's locations
    await this.prisma.userLocation.deleteMany({
      where: { location: { companyId } },
    })
    // Delete all locations
    await this.prisma.location.deleteMany({
      where: { companyId },
    })
    // Delete all users in this company
    await this.prisma.user.deleteMany({
      where: { companyId },
    })
    // Delete the company
    await this.prisma.company.delete({ where: { id: companyId } })
  }

  async getCompanyUsers(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } })
    if (!company) throw new NotFoundException('Company not found')

    return this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        locations: { select: { locationId: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async deleteBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { childBookings: true },
    })
    if (!booking) throw new NotFoundException('Booking not found')

    // If this is a parent of recurring bookings, delete children first
    if (booking.childBookings.length > 0) {
      await this.prisma.booking.deleteMany({
        where: { parentBookingId: bookingId },
      })
    }

    await this.prisma.booking.delete({ where: { id: bookingId } })
  }
}
