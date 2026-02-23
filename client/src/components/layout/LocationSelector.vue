<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocationsStore } from '@/stores/locations'
import { useAuthStore } from '@/stores/auth'
import { useAdminCompanyStore } from '@/stores/adminCompany'

const { t } = useI18n()
const locationsStore = useLocationsStore()
const authStore = useAuthStore()
const adminCompanyStore = useAdminCompanyStore()

onMounted(() => {
  if (locationsStore.locations.length === 0) {
    const companyId = authStore.isAdmin ? adminCompanyStore.selectedCompanyId || undefined : undefined
    locationsStore.fetchLocations(companyId)
  }
})
</script>

<template>
  <v-select
    :model-value="locationsStore.selectedLocationId"
    :items="locationsStore.locations"
    item-title="name"
    item-value="id"
    :label="t('nav.location')"
    density="compact"
    variant="solo-filled"
    flat
    hide-details
    rounded="pill"
    style="max-width: 220px"
    :loading="locationsStore.loading"
    bg-color="rgba(255,255,255,0.15)"
    @update:model-value="locationsStore.selectLocation($event)"
  />
</template>
