export interface UserLocation {
  locationId: string
}

export interface ManagedUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'user' | 'super_user' | 'admin'
  color: string
  companyId: string
  createdAt: string
  locations: UserLocation[]
  temporaryPassword?: string
}

export interface InviteUserData {
  email: string
  firstName: string
  lastName: string
  role?: 'user' | 'super_user' | 'admin'
}

export interface UpdateUserData {
  firstName?: string
  lastName?: string
  role?: 'user' | 'super_user' | 'admin'
  password?: string
}

export interface Company {
  id: string
  name: string
  logo?: string | null
  color?: string
  createdAt: string
  updatedAt: string
  _count?: { users: number; locations: number }
}
