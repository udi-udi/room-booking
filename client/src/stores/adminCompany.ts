import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { adminService } from '@/services/adminService'
import { companyService } from '@/services/companyService'
import type { Company } from '@/types/user.types'

export const useAdminCompanyStore = defineStore('adminCompany', () => {
  const companies = ref<Company[]>([])
  const selectedCompanyId = ref<string | null>(localStorage.getItem('adminSelectedCompanyId'))
  const loading = ref(false)
  const initialized = ref(false)

  // Full details of selected company (logo, color, name)
  const selectedCompanyDetail = ref<Company | null>(null)

  const selectedCompany = computed(() =>
    companies.value.find(c => c.id === selectedCompanyId.value) ?? null,
  )

  const companyOptions = computed(() =>
    companies.value.map(c => ({ title: c.name, value: c.id })),
  )

  // Persist selection
  watch(selectedCompanyId, (id) => {
    if (id) {
      localStorage.setItem('adminSelectedCompanyId', id)
    } else {
      localStorage.removeItem('adminSelectedCompanyId')
    }
  })

  async function fetchCompanies() {
    loading.value = true
    try {
      companies.value = await adminService.getCompanies()
      // Validate persisted selection still exists
      if (selectedCompanyId.value && !companies.value.find(c => c.id === selectedCompanyId.value)) {
        selectedCompanyId.value = companies.value[0]?.id ?? null
      }
      if (!selectedCompanyId.value && companies.value.length > 0) {
        selectedCompanyId.value = companies.value[0].id
      }
      // Load full details for the selected company
      await loadSelectedCompanyDetail()
      initialized.value = true
    } finally {
      loading.value = false
    }
  }

  async function loadSelectedCompanyDetail() {
    if (!selectedCompanyId.value) {
      selectedCompanyDetail.value = null
      return
    }
    try {
      selectedCompanyDetail.value = await companyService.getCompany(selectedCompanyId.value)
    } catch {
      selectedCompanyDetail.value = null
    }
  }

  function selectCompany(id: string) {
    selectedCompanyId.value = id
  }

  function reset() {
    companies.value = []
    selectedCompanyId.value = null
    selectedCompanyDetail.value = null
    initialized.value = false
    localStorage.removeItem('adminSelectedCompanyId')
  }

  return {
    companies,
    selectedCompanyId,
    selectedCompany,
    selectedCompanyDetail,
    companyOptions,
    loading,
    initialized,
    fetchCompanies,
    loadSelectedCompanyDetail,
    selectCompany,
    reset,
  }
})
