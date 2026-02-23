import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { BookingsService } from './bookings.service.js'
import { CreateBookingDto } from './dto/create-booking.dto.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'

interface AuthUser {
  id: string
  role: string
  companyId: string
}

@ApiTags('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('bookings')
  @ApiOperation({ summary: "Get current user's bookings" })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  async getUserBookings(
    @Request() req: { user: AuthUser },
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const bookings = await this.bookingsService.getUserBookings(req.user.id, start, end)
    return bookings
  }

  @Get('rooms/:roomId/bookings')
  @ApiOperation({ summary: 'Get bookings for a room' })
  @ApiQuery({ name: 'start', required: true })
  @ApiQuery({ name: 'end', required: true })
  async getRoomBookings(
    @Param('roomId') roomId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const bookings = await this.bookingsService.getRoomBookings(roomId, start, end)
    return bookings
  }

  @Get('locations/:locationId/bookings')
  @ApiOperation({ summary: 'Get all bookings for a location' })
  @ApiQuery({ name: 'start', required: true })
  @ApiQuery({ name: 'end', required: true })
  async getLocationBookings(
    @Param('locationId') locationId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const bookings = await this.bookingsService.getLocationBookings(locationId, start, end)
    return bookings
  }

  @Post('bookings')
  @ApiOperation({ summary: 'Create a booking' })
  async create(
    @Body() dto: CreateBookingDto,
    @Request() req: { user: AuthUser },
  ) {
    const effectiveUserId =
      dto.userId && ['super_user', 'admin'].includes(req.user.role)
        ? dto.userId
        : req.user.id
    const booking = await this.bookingsService.create(dto, effectiveUserId)
    return booking
  }

  @Delete('bookings/:id')
  @ApiOperation({ summary: 'Cancel a booking' })
  async remove(
    @Param('id') id: string,
    @Request() req: { user: AuthUser },
  ) {
    await this.bookingsService.remove(id, req.user.id, req.user.role)
    return { message: 'Booking cancelled' }
  }

  @Delete('bookings/:id/recurring')
  @ApiOperation({ summary: 'Delete recurring bookings from a date forward' })
  @ApiQuery({ name: 'fromDate', required: true })
  async removeRecurring(
    @Param('id') id: string,
    @Query('fromDate') fromDate: string,
    @Request() req: { user: AuthUser },
  ) {
    const result = await this.bookingsService.removeRecurringFromDate(
      id,
      fromDate,
      req.user.id,
      req.user.role,
    )
    return result
  }
}
