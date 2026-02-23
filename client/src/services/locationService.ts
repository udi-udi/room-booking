import api from './api'
import type { Location, Room } from '@/types/location.types'
import type { BookingUser } from '@/types/booking.types'
import type { ApiResponse } from '@/types/auth.types'

export const locationService = {
  async getLocations(companyId?: string): Promise<Location[]> {
    const params = companyId ? { companyId } : {}
    const { data } = await api.get<ApiResponse<Location[]>>('/locations', { params })
    return data.data
  },

  async createLocation(name: string, companyId?: string): Promise<Location> {
    const payload: { name: string; companyId?: string } = { name }
    if (companyId) payload.companyId = companyId
    const { data } = await api.post<ApiResponse<Location>>('/locations', payload)
    return data.data
  },

  async updateLocation(id: string, name: string): Promise<Location> {
    const { data } = await api.put<ApiResponse<Location>>(`/locations/${id}`, { name })
    return data.data
  },

  async deleteLocation(id: string): Promise<void> {
    await api.delete(`/locations/${id}`)
  },

  async getRooms(locationId: string): Promise<Room[]> {
    const { data } = await api.get<ApiResponse<Room[]>>(`/locations/${locationId}/rooms`)
    return data.data
  },

  async createRoom(locationId: string, name: string): Promise<Room> {
    const { data } = await api.post<ApiResponse<Room>>(`/locations/${locationId}/rooms`, { name })
    return data.data
  },

  async updateRoom(id: string, name: string): Promise<Room> {
    const { data } = await api.put<ApiResponse<Room>>(`/rooms/${id}`, { name })
    return data.data
  },

  async deleteRoom(id: string): Promise<void> {
    await api.delete(`/rooms/${id}`)
  },

  async getLocationUsers(locationId: string): Promise<BookingUser[]> {
    const { data } = await api.get<ApiResponse<BookingUser[]>>(`/locations/${locationId}/users`)
    return data.data
  },
}
