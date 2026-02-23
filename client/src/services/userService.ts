import api from './api'
import type { ManagedUser, InviteUserData, UpdateUserData } from '@/types/user.types'
import type { ApiResponse } from '@/types/auth.types'

export const userService = {
  async getUsers(companyId?: string): Promise<ManagedUser[]> {
    const params = companyId ? { companyId } : {}
    const { data } = await api.get<ApiResponse<ManagedUser[]>>('/users', { params })
    return data.data
  },

  async inviteUser(userData: InviteUserData & { companyId?: string }): Promise<ManagedUser> {
    const { data } = await api.post<ApiResponse<ManagedUser>>('/users/invite', userData)
    return data.data
  },

  async updateUser(id: string, userData: UpdateUserData): Promise<ManagedUser> {
    const { data } = await api.put<ApiResponse<ManagedUser>>(`/users/${id}`, userData)
    return data.data
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`)
  },

  async resetPassword(userId: string): Promise<{ temporaryPassword: string }> {
    const { data } = await api.put<ApiResponse<{ temporaryPassword: string }>>(`/users/${userId}/reset-password`)
    return data.data
  },

  async assignLocations(userId: string, locationIds: string[]): Promise<ManagedUser> {
    const { data } = await api.put<ApiResponse<ManagedUser>>(`/users/${userId}/locations`, { locationIds })
    return data.data
  },
}
