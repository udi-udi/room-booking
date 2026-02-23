import api from './api'
import type { Company } from '@/types/user.types'
import type { ApiResponse } from '@/types/auth.types'

export const companyService = {
  async getCompany(companyId?: string): Promise<Company> {
    const params = companyId ? { companyId } : {}
    const { data } = await api.get<ApiResponse<Company>>('/company', { params })
    return data.data
  },

  async updateCompany(payload: { name: string; logo?: string | null; color?: string; companyId?: string }): Promise<Company> {
    const { data } = await api.put<ApiResponse<Company>>('/company', payload)
    return data.data
  },
}
