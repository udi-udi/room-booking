import type { Room } from './location.types'

export interface BookingUser {
  id: string
  firstName: string
  lastName: string
  color: string
}

export interface Booking {
  id: string
  roomId: string
  userId: string
  startTime: string
  endTime: string
  isRecurring: boolean
  recurrencePattern?: 'weekly'
  recurrenceEndDate?: string
  parentBookingId?: string
  room?: Room
  user: BookingUser
  childBookings?: Booking[]
  createdAt: string
  updatedAt: string
}

export interface CreateBookingData {
  roomId: string
  startTime: string
  endTime: string
  isRecurring?: boolean
  recurrencePattern?: 'weekly'
  userId?: string
}
