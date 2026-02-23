<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminService } from '@/services/adminService'
import type { Company, ManagedUser } from '@/types/user.types'

const { t } = useI18n()

const companies = ref<Company[]>([])
const loading = ref(false)
const error = ref('')
const success = ref('')

// Create company dialog
const createDialog = ref(false)
const newCompanyName = ref('')
const creating = ref(false)

// Delete company dialog
const deleteDialog = ref(false)
const companyToDelete = ref<Company | null>(null)
const deleting = ref(false)

// Users dialog
const usersDialog = ref(false)
const usersCompany = ref<Company | null>(null)
const companyUsers = ref<ManagedUser[]>([])
const loadingUsers = ref(false)

// Delete booking dialog
const deleteBookingDialog = ref(false)
const bookingIdToDelete = ref('')
const deletingBooking = ref(false)

onMounted(async () => {
  await loadCompanies()
})

async function loadCompanies() {
  loading.value = true
  error.value = ''
  try {
    companies.value = await adminService.getCompanies()
  } catch (e: any) {
    error.value = e.response?.data?.error || t('common.error')
  } finally {
    loading.value = false
  }
}

async function handleCreateCompany() {
  if (!newCompanyName.value.trim()) return
  creating.value = true
  error.value = ''
  try {
    await adminService.createCompany(newCompanyName.value.trim())
    createDialog.value = false
    newCompanyName.value = ''
    success.value = t('common.success')
    setTimeout(() => { success.value = '' }, 3000)
    await loadCompanies()
  } catch (e: any) {
    error.value = e.response?.data?.error || t('common.error')
  } finally {
    creating.value = false
  }
}

function confirmDeleteCompany(company: Company) {
  companyToDelete.value = company
  deleteDialog.value = true
}

async function handleDeleteCompany() {
  if (!companyToDelete.value) return
  deleting.value = true
  error.value = ''
  try {
    await adminService.deleteCompany(companyToDelete.value.id)
    deleteDialog.value = false
    companyToDelete.value = null
    success.value = t('common.success')
    setTimeout(() => { success.value = '' }, 3000)
    await loadCompanies()
  } catch (e: any) {
    error.value = e.response?.data?.error || t('common.error')
  } finally {
    deleting.value = false
  }
}

async function viewCompanyUsers(company: Company) {
  usersCompany.value = company
  usersDialog.value = true
  loadingUsers.value = true
  try {
    companyUsers.value = await adminService.getCompanyUsers(company.id)
  } catch (e: any) {
    error.value = e.response?.data?.error || t('common.error')
  } finally {
    loadingUsers.value = false
  }
}

function openDeleteBookingDialog() {
  bookingIdToDelete.value = ''
  deleteBookingDialog.value = true
}

async function handleDeleteBooking() {
  if (!bookingIdToDelete.value.trim()) return
  deletingBooking.value = true
  error.value = ''
  try {
    await adminService.deleteBooking(bookingIdToDelete.value.trim())
    deleteBookingDialog.value = false
    bookingIdToDelete.value = ''
    success.value = t('common.success')
    setTimeout(() => { success.value = '' }, 3000)
  } catch (e: any) {
    error.value = e.response?.data?.error || t('common.error')
  } finally {
    deletingBooking.value = false
  }
}

const roleColor = (role: string) => {
  switch (role) {
    case 'admin': return 'error'
    case 'super_user': return 'warning'
    default: return 'info'
  }
}
</script>

<template>
  <div>
    <h1 class="text-h4 mb-6">{{ t('admin.dashboard') }}</h1>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <v-alert v-if="error" type="error" closable class="mb-4" @click:close="error = ''">
      {{ error }}
    </v-alert>

    <v-alert v-if="success" type="success" closable class="mb-4" @click:close="success = ''">
      {{ success }}
    </v-alert>

    <!-- Actions toolbar -->
    <div class="d-flex ga-2 mb-4">
      <v-btn color="primary" prepend-icon="mdi-plus" @click="createDialog = true">
        {{ t('admin.createCompany') }}
      </v-btn>
      <v-btn color="error" variant="outlined" prepend-icon="mdi-calendar-remove" @click="openDeleteBookingDialog">
        {{ t('admin.deleteBooking') }}
      </v-btn>
    </div>

    <!-- Companies table -->
    <v-card>
      <v-card-title>{{ t('admin.companies') }}</v-card-title>
      <v-table>
        <thead>
          <tr>
            <th>{{ t('admin.companyName') }}</th>
            <th>{{ t('nav.users') }}</th>
            <th>{{ t('nav.locations') }}</th>
            <th>{{ t('admin.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="company in companies" :key="company.id">
            <td>{{ company.name }}</td>
            <td>{{ company._count?.users ?? 0 }}</td>
            <td>{{ company._count?.locations ?? 0 }}</td>
            <td>
              <v-btn icon size="small" variant="text" @click="viewCompanyUsers(company)">
                <v-icon>mdi-account-group</v-icon>
                <v-tooltip activator="parent" location="top">{{ t('admin.viewUsers') }}</v-tooltip>
              </v-btn>
              <v-btn icon size="small" variant="text" color="error" @click="confirmDeleteCompany(company)">
                <v-icon>mdi-delete</v-icon>
                <v-tooltip activator="parent" location="top">{{ t('admin.delete') }}</v-tooltip>
              </v-btn>
            </td>
          </tr>
          <tr v-if="!loading && companies.length === 0">
            <td colspan="4" class="text-center pa-4">{{ t('common.noData') }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Create company dialog -->
    <v-dialog v-model="createDialog" max-width="400">
      <v-card>
        <v-card-title>{{ t('admin.createCompany') }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newCompanyName"
            :label="t('admin.companyName')"
            variant="outlined"
            :disabled="creating"
            autofocus
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="createDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn
            color="primary"
            :loading="creating"
            :disabled="!newCompanyName.trim()"
            @click="handleCreateCompany"
          >
            {{ t('common.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete company confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-error">{{ t('admin.deleteCompanyTitle') }}</v-card-title>
        <v-card-text>
          <p>{{ t('admin.confirmDelete') }} <strong>{{ companyToDelete?.name }}</strong>?</p>
          <v-alert type="warning" variant="tonal" class="mt-2">
            {{ t('admin.deleteCompanyWarning') }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="error" :loading="deleting" @click="handleDeleteCompany">
            {{ t('admin.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Company users dialog -->
    <v-dialog v-model="usersDialog" max-width="700">
      <v-card>
        <v-card-title>
          {{ t('admin.usersInCompany') }}: {{ usersCompany?.name }}
        </v-card-title>
        <v-card-text>
          <v-progress-linear v-if="loadingUsers" indeterminate color="primary" class="mb-4" />
          <v-table v-else>
            <thead>
              <tr>
                <th>{{ t('auth.firstName') }}</th>
                <th>{{ t('auth.lastName') }}</th>
                <th>{{ t('auth.email') }}</th>
                <th>{{ t('admin.role') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in companyUsers" :key="user.id">
                <td>{{ user.firstName }}</td>
                <td>{{ user.lastName }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <v-chip :color="roleColor(user.role)" size="small">
                    {{ t(`admin.role${user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_u', 'U')}`) }}
                  </v-chip>
                </td>
              </tr>
              <tr v-if="!loadingUsers && companyUsers.length === 0">
                <td colspan="4" class="text-center pa-4">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="usersDialog = false">{{ t('common.cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete booking dialog -->
    <v-dialog v-model="deleteBookingDialog" max-width="400">
      <v-card>
        <v-card-title>{{ t('admin.deleteBooking') }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="bookingIdToDelete"
            :label="t('admin.bookingId')"
            variant="outlined"
            :disabled="deletingBooking"
            autofocus
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteBookingDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn
            color="error"
            :loading="deletingBooking"
            :disabled="!bookingIdToDelete.trim()"
            @click="handleDeleteBooking"
          >
            {{ t('admin.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
