import api from './api'
import type { Company, ManagedUser } from '@/types/user.types'
import type { ApiResponse } from '@/types/auth.types'

export const adminService = {
  async getCompanies(): Promise<Company[]> {
    const { data } = await api.get<ApiResponse<Company[]>>('/admin/companies')
    return data.data
  },

  async createCompany(name: string): Promise<Company> {
    const { data } = await api.post<ApiResponse<Company>>('/admin/companies', { name })
    return data.data
  },

  async deleteCompany(id: string): Promise<void> {
    await api.delete(`/admin/companies/${id}`)
  },

  async getCompanyUsers(companyId: string): Promise<ManagedUser[]> {
    const { data } = await api.get<ApiResponse<ManagedUser[]>>(`/admin/companies/${companyId}/users`)
    return data.data
  },

  async deleteBooking(id: string): Promise<void> {
    await api.delete(`/admin/bookings/${id}`)
  },
}
