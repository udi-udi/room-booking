<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { companyService } from '@/services/companyService'
import { useNotificationStore } from '@/stores/notification'
import { useAuthStore } from '@/stores/auth'
import { useAdminCompanyStore } from '@/stores/adminCompany'
import type { Company } from '@/types/user.types'

const { t } = useI18n()
const notificationStore = useNotificationStore()
const authStore = useAuthStore()
const adminCompanyStore = useAdminCompanyStore()

const company = ref<Company | null>(null)
const companyName = ref('')
const companyColor = ref('#5C6BC0')
const logoPreview = ref<string | null>(null)
const logoFile = ref<File[]>([])
const logoRemoved = ref(false)
const loading = ref(false)
const saving = ref(false)

async function loadCompany() {
  loading.value = true
  try {
    const cid = authStore.isAdmin ? adminCompanyStore.selectedCompanyId || undefined : undefined
    company.value = await companyService.getCompany(cid)
    companyName.value = company.value.name
    logoPreview.value = company.value.logo || null
    companyColor.value = company.value.color || '#5C6BC0'
  } catch {
    // Error toast handled by API interceptor
  } finally {
    loading.value = false
  }
}

onMounted(() => loadCompany())

// Reload when admin switches company
watch(() => adminCompanyStore.selectedCompanyId, () => {
  if (authStore.isAdmin) loadCompany()
})

function onFileChange(files: File | File[]) {
  if (!files) return
  const file = Array.isArray(files) ? files[0] : files
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    logoPreview.value = e.target?.result as string
    logoRemoved.value = false
  }
  reader.readAsDataURL(file)
}

function removeLogo() {
  logoPreview.value = null
  logoFile.value = []
  logoRemoved.value = true
}

function hasChanges(): boolean {
  if (!company.value) return false
  if (companyName.value.trim() !== company.value.name) return true
  if (logoRemoved.value && company.value.logo) return true
  if (logoPreview.value !== (company.value.logo || null) && !logoRemoved.value) return true
  if (companyColor.value !== (company.value.color || '#5C6BC0')) return true
  return false
}

async function handleSave() {
  if (!companyName.value.trim()) return
  saving.value = true
  try {
    const payload: { name: string; logo?: string | null; color?: string; companyId?: string } = {
      name: companyName.value.trim(),
    }
    if (logoRemoved.value) {
      payload.logo = null
    } else if (logoPreview.value !== (company.value?.logo || null)) {
      payload.logo = logoPreview.value
    }
    if (companyColor.value !== (company.value?.color || '#5C6BC0')) {
      payload.color = companyColor.value
    }
    if (authStore.isAdmin && adminCompanyStore.selectedCompanyId) {
      payload.companyId = adminCompanyStore.selectedCompanyId
    }
    company.value = await companyService.updateCompany(payload)
    logoRemoved.value = false
    logoFile.value = []
    // Refresh app bar: admin uses selected company detail, others use own profile
    if (authStore.isAdmin) {
      await adminCompanyStore.loadSelectedCompanyDetail()
    } else {
      await authStore.refreshProfile()
    }
    notificationStore.showSuccess(t('common.success'))
  } catch {
    // Error toast handled by API interceptor
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-h4 mb-6">{{ t('admin.companySettings') }}</h1>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <v-card v-if="company" max-width="600">
      <v-card-text>
        <v-text-field
          v-model="companyName"
          :label="t('admin.companyName')"
          variant="outlined"
          :disabled="saving"
        />

        <div class="mt-4">
          <div class="text-subtitle-1 mb-2">{{ t('admin.companyLogo') }}</div>

          <div v-if="logoPreview" class="mb-3 d-flex align-center ga-4">
            <v-img
              :src="logoPreview"
              max-width="200"
              max-height="100"
              contain
            />
            <v-btn
              color="error"
              variant="outlined"
              size="small"
              :disabled="saving"
              @click="removeLogo"
            >
              {{ t('admin.removeLogo') }}
            </v-btn>
          </div>

          <v-file-input
            v-model="logoFile"
            :label="t('admin.uploadLogo')"
            accept="image/*"
            variant="outlined"
            prepend-icon="mdi-image"
            :disabled="saving"
            @update:model-value="onFileChange"
          />
        </div>

        <div class="mt-4">
          <div class="text-subtitle-1 mb-2">{{ t('admin.companyColor') }}</div>
          <v-color-picker
            v-model="companyColor"
            mode="hexa"
            show-swatches
            hide-inputs
            :disabled="saving"
          />
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          :loading="saving"
          :disabled="!hasChanges()"
          @click="handleSave"
        >
          {{ t('admin.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
