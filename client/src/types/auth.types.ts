export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'user' | 'super_user' | 'admin'
  color: string
  weekStartDay: number
  companyId: string
  createdAt: string
  mustChangePassword: boolean
  company: {
    name: string
    logo: string | null
    color: string
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  companyName: string
  companyId?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
}
