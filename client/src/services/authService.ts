import api from './api'
import type { LoginCredentials, RegisterData, AuthTokens, User, ApiResponse } from '@/types/auth.types'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const { data } = await api.post<ApiResponse<AuthTokens>>('/auth/login', credentials)
    return data.data
  },

  async register(registerData: RegisterData): Promise<AuthTokens> {
    const { data } = await api.post<ApiResponse<AuthTokens>>('/auth/register', registerData)
    return data.data
  },

  async getProfile(): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>('/auth/me')
    return data.data
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const { data } = await api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken })
    return data.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async updateMyProfile(profile: { firstName?: string; lastName?: string; color?: string; weekStartDay?: number }): Promise<{ id: string; firstName: string; lastName: string; color: string; weekStartDay: number }> {
    const { data } = await api.put<ApiResponse<{ id: string; firstName: string; lastName: string; color: string; weekStartDay: number }>>('/auth/me/profile', profile)
    return data.data
  },

  async forceChangePassword(newPassword: string): Promise<void> {
    await api.put('/auth/me/set-password', { newPassword })
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/auth/me/password', { currentPassword, newPassword })
  },
}
