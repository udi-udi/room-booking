import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { locationService } from '@/services/locationService'
import type { Location } from '@/types/location.types'

export const useLocationsStore = defineStore('locations', () => {
  const locations = ref<Location[]>([])
  const selectedLocationId = ref<string | null>(localStorage.getItem('selectedLocationId'))
  const loading = ref(false)

  const selectedLocation = computed(() =>
    locations.value.find((l) => l.id === selectedLocationId.value) ?? locations.value[0] ?? null,
  )

  const rooms = computed(() => selectedLocation.value?.rooms ?? [])

  async function fetchLocations(companyId?: string) {
    loading.value = true
    try {
      locations.value = await locationService.getLocations(companyId)
      // If saved selection is not in the list, reset to first
      if (selectedLocationId.value && !locations.value.find((l) => l.id === selectedLocationId.value)) {
        selectedLocationId.value = locations.value[0]?.id ?? null
      }
      // If no selection yet, pick first
      if (!selectedLocationId.value && locations.value.length > 0) {
        selectedLocationId.value = locations.value[0].id
      }
    } finally {
      loading.value = false
    }
  }

  function selectLocation(id: string) {
    selectedLocationId.value = id
    localStorage.setItem('selectedLocationId', id)
  }

  function reset() {
    locations.value = []
    selectedLocationId.value = null
    localStorage.removeItem('selectedLocationId')
  }

  return {
    locations,
    selectedLocationId,
    selectedLocation,
    rooms,
    loading,
    fetchLocations,
    selectLocation,
    reset,
  }
})
