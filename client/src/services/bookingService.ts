import api from './api'
import type { Booking, CreateBookingData } from '@/types/booking.types'
import type { ApiResponse } from '@/types/auth.types'

export const bookingService = {
  async getUserBookings(start?: string, end?: string): Promise<Booking[]> {
    const params = new URLSearchParams()
    if (start) params.set('start', start)
    if (end) params.set('end', end)
    const query = params.toString() ? `?${params.toString()}` : ''
    const { data } = await api.get<ApiResponse<Booking[]>>(`/bookings${query}`)
    return data.data
  },

  async getRoomBookings(roomId: string, start: string, end: string): Promise<Booking[]> {
    const { data } = await api.get<ApiResponse<Booking[]>>(
      `/rooms/${roomId}/bookings?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    )
    return data.data
  },

  async getLocationBookings(locationId: string, start: string, end: string): Promise<Booking[]> {
    const { data } = await api.get<ApiResponse<Booking[]>>(
      `/locations/${locationId}/bookings?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    )
    return data.data
  },

  async createBooking(bookingData: CreateBookingData): Promise<Booking> {
    const { data } = await api.post<ApiResponse<Booking>>('/bookings', bookingData)
    return data.data
  },

  async deleteBooking(id: string): Promise<void> {
    await api.delete(`/bookings/${id}`)
  },

  async deleteRecurringFromDate(id: string, fromDate: string): Promise<{ deletedCount: number }> {
    const { data } = await api.delete<ApiResponse<{ deletedCount: number }>>(
      `/bookings/${id}/recurring?fromDate=${encodeURIComponent(fromDate)}`,
    )
    return data.data
  },
}
