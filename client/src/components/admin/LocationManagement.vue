<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { locationService } from '@/services/locationService'
import { useAuthStore } from '@/stores/auth'
import { useAdminCompanyStore } from '@/stores/adminCompany'
import { useNotificationStore } from '@/stores/notification'
import type { Location, Room } from '@/types/location.types'

const { t } = useI18n()
const authStore = useAuthStore()
const adminCompanyStore = useAdminCompanyStore()
const notificationStore = useNotificationStore()

const locations = ref<Location[]>([])
const loading = ref(false)

// Location dialog
const locationDialog = ref(false)
const editingLocation = ref<Location | null>(null)
const locationName = ref('')
const locationSaving = ref(false)

// Room dialog
const roomDialog = ref(false)
const roomLocationId = ref('')
const editingRoom = ref<Room | null>(null)
const roomName = ref('')
const roomSaving = ref(false)

// Delete dialog
const deleteDialog = ref(false)
const deleteTarget = ref<{ type: 'location' | 'room'; id: string; name: string } | null>(null)
const deleting = ref(false)

onMounted(() => fetchLocations())

// Reload when admin switches company
watch(() => adminCompanyStore.selectedCompanyId, () => {
  if (authStore.isAdmin) fetchLocations()
})

async function fetchLocations() {
  loading.value = true
  try {
    const cid = authStore.isAdmin ? adminCompanyStore.selectedCompanyId || undefined : undefined
    locations.value = await locationService.getLocations(cid)
  } catch {
    // Error toast handled by API interceptor
  } finally {
    loading.value = false
  }
}

function openAddLocation() {
  editingLocation.value = null
  locationName.value = ''
  locationDialog.value = true
}

function openEditLocation(loc: Location) {
  editingLocation.value = loc
  locationName.value = loc.name
  locationDialog.value = true
}

async function saveLocation() {
  if (!locationName.value.trim()) return
  locationSaving.value = true
  try {
    if (editingLocation.value) {
      await locationService.updateLocation(editingLocation.value.id, locationName.value.trim())
    } else {
      const cid = authStore.isAdmin ? adminCompanyStore.selectedCompanyId || undefined : undefined
      await locationService.createLocation(locationName.value.trim(), cid)
    }
    locationDialog.value = false
    notificationStore.showSuccess(t('common.success'))
    await fetchLocations()
  } catch {
    // Error toast handled by API interceptor
  } finally {
    locationSaving.value = false
  }
}

function openAddRoom(locationId: string) {
  editingRoom.value = null
  roomLocationId.value = locationId
  roomName.value = ''
  roomDialog.value = true
}

function openEditRoom(room: Room) {
  editingRoom.value = room
  roomName.value = room.name
  roomDialog.value = true
}

async function saveRoom() {
  if (!roomName.value.trim()) return
  roomSaving.value = true
  try {
    if (editingRoom.value) {
      await locationService.updateRoom(editingRoom.value.id, roomName.value.trim())
    } else {
      await locationService.createRoom(roomLocationId.value, roomName.value.trim())
    }
    roomDialog.value = false
    notificationStore.showSuccess(t('common.success'))
    await fetchLocations()
  } catch {
    // Error toast handled by API interceptor
  } finally {
    roomSaving.value = false
  }
}

function confirmDelete(type: 'location' | 'room', id: string, name: string) {
  deleteTarget.value = { type, id, name }
  deleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    if (deleteTarget.value.type === 'location') {
      await locationService.deleteLocation(deleteTarget.value.id)
    } else {
      await locationService.deleteRoom(deleteTarget.value.id)
    }
    deleteDialog.value = false
    deleteTarget.value = null
    notificationStore.showSuccess(t('common.success'))
    await fetchLocations()
  } catch {
    // Error toast handled by API interceptor
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">{{ t('admin.locationManagement') }}</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddLocation">
        {{ t('admin.addLocation') }}
      </v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <v-alert v-if="!loading && locations.length === 0" type="info" class="mb-4">
      {{ t('common.noData') }}
    </v-alert>

    <v-card v-for="loc in locations" :key="loc.id" class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-icon class="me-2">mdi-map-marker</v-icon>
        {{ loc.name }}
        <v-spacer />
        <v-btn icon size="small" variant="text" @click="openEditLocation(loc)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="text" color="error" @click="confirmDelete('location', loc.id, loc.name)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <div class="d-flex align-center mb-2">
          <span class="text-subtitle-2 text-grey">{{ t('admin.rooms') || 'Rooms' }}</span>
          <v-spacer />
          <v-btn size="small" variant="tonal" prepend-icon="mdi-plus" @click="openAddRoom(loc.id)">
            {{ t('admin.addRoom') }}
          </v-btn>
        </div>
        <v-chip-group v-if="loc.rooms && loc.rooms.length > 0">
          <v-chip
            v-for="room in loc.rooms"
            :key="room.id"
            variant="outlined"
            closable
            @click="openEditRoom(room)"
            @click:close="confirmDelete('room', room.id, room.name)"
          >
            {{ room.name }}
          </v-chip>
        </v-chip-group>
        <p v-else class="text-grey text-body-2">{{ t('calendar.noRooms') }}</p>
      </v-card-text>
    </v-card>

    <!-- Location Dialog -->
    <v-dialog v-model="locationDialog" max-width="400">
      <v-card>
        <v-card-title>
          {{ editingLocation ? t('admin.edit') : t('admin.addLocation') }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="locationName"
            :label="t('admin.locationName')"
            variant="outlined"
            autofocus
            @keyup.enter="saveLocation"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="locationDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="primary" :loading="locationSaving" :disabled="!locationName.trim()" @click="saveLocation">
            {{ t('admin.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Room Dialog -->
    <v-dialog v-model="roomDialog" max-width="400">
      <v-card>
        <v-card-title>
          {{ editingRoom ? t('admin.edit') : t('admin.addRoom') }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="roomName"
            :label="t('admin.roomName')"
            variant="outlined"
            autofocus
            @keyup.enter="saveRoom"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="roomDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="primary" :loading="roomSaving" :disabled="!roomName.trim()" @click="saveRoom">
            {{ t('admin.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>{{ t('admin.delete') }}</v-card-title>
        <v-card-text>
          {{ t('admin.confirmDelete') }} <strong>{{ deleteTarget?.name }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="error" :loading="deleting" @click="handleDelete">{{ t('admin.delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
