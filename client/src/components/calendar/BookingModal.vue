<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { locationService } from '@/services/locationService'
import type { BookingUser } from '@/types/booking.types'

const { t } = useI18n()
const authStore = useAuthStore()

const props = defineProps<{
  modelValue: boolean
  roomId: string
  roomName: string
  startTime: Date
  endTime?: Date | null
  locationId: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [data: {
    roomId: string
    startTime: string
    endTime: string
    isRecurring: boolean
    recurrencePattern?: 'weekly'
    userId?: string
  }]
}>()

const startTimeSlot = ref('')
const endTimeSlot = ref('')
const isRecurring = ref(false)
const error = ref('')

// Book on behalf: user selection for super_user/admin
const locationUsers = ref<BookingUser[]>([])
const selectedUserId = ref<string>('')
const loadingUsers = ref(false)

const userOptions = computed(() =>
  locationUsers.value.map((u) => ({
    title: `${u.firstName} ${u.lastName}`,
    value: u.id,
  })),
)

function buildTimeOptions(fromHour: number, fromMin: number, toHour: number, toMin: number) {
  const options: Array<{ title: string; value: string }> = []
  const base = new Date(props.startTime)
  const current = new Date(base)
  current.setHours(fromHour, fromMin, 0, 0)
  const end = new Date(base)
  end.setHours(toHour, toMin, 0, 0)
  while (current <= end) {
    const hh = current.getHours().toString().padStart(2, '0')
    const mm = current.getMinutes().toString().padStart(2, '0')
    options.push({ title: `${hh}:${mm}`, value: current.toISOString() })
    current.setMinutes(current.getMinutes() + 15)
  }
  return options
}

// Start time options: 8:00 to 21:45 (last slot that can have an end time)
const startTimeOptions = computed(() => buildTimeOptions(8, 0, 21, 45))

// End time options: 8:15 to 22:00 (independent of start — validated on confirm)
const endTimeOptions = computed(() => buildTimeOptions(8, 15, 22, 0))

const startDateFormatted = computed(() => {
  return props.startTime.toLocaleDateString()
})

watch(() => props.modelValue, async (val) => {
  if (val) {
    // Set start time from prop
    const propStart = props.startTime
    const startIso = propStart.toISOString()
    const startMatch = startTimeOptions.value.find(o => o.value === startIso)
    startTimeSlot.value = startMatch?.value ?? startTimeOptions.value[0]?.value ?? ''

    // Set end time from prop or default to +1h
    if (props.endTime) {
      const endIso = props.endTime.toISOString()
      const opts = endTimeOptions.value
      const endMatch = opts.find(o => o.value === endIso)
      endTimeSlot.value = endMatch?.value ?? opts[3]?.value ?? opts[0]?.value ?? ''
    } else {
      const opts = endTimeOptions.value
      endTimeSlot.value = opts[3]?.value ?? opts[0]?.value ?? ''
    }
    isRecurring.value = false
    error.value = ''

    // Load location users for super_user/admin
    if (authStore.isSuperUser && props.locationId) {
      loadingUsers.value = true
      try {
        locationUsers.value = await locationService.getLocationUsers(props.locationId)
        selectedUserId.value = authStore.user?.id ?? ''
      } catch {
        locationUsers.value = []
      } finally {
        loadingUsers.value = false
      }
    }
  }
}, { immediate: true })

function handleConfirm() {
  error.value = ''
  if (!startTimeSlot.value) {
    error.value = t('booking.startTime') + ' required'
    return
  }
  if (!endTimeSlot.value) {
    error.value = t('booking.endTime') + ' required'
    return
  }
  if (new Date(startTimeSlot.value) >= new Date(endTimeSlot.value)) {
    error.value = t('booking.startAfterEnd')
    return
  }

  const confirmData: {
    roomId: string
    startTime: string
    endTime: string
    isRecurring: boolean
    recurrencePattern?: 'weekly'
    userId?: string
  } = {
    roomId: props.roomId,
    startTime: startTimeSlot.value,
    endTime: endTimeSlot.value,
    isRecurring: isRecurring.value,
    recurrencePattern: isRecurring.value ? 'weekly' : undefined,
  }

  if (authStore.isSuperUser && selectedUserId.value && selectedUserId.value !== authStore.user?.id) {
    confirmData.userId = selectedUserId.value
  }

  emit('confirm', confirmData)
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="440"
    :persistent="props.loading"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="pa-2">
      <v-card-title class="text-h6 d-flex align-center">
        <v-icon color="primary" class="me-2" size="small">mdi-calendar-plus</v-icon>
        {{ t('booking.create') }}
      </v-card-title>
      <v-card-text>
        <v-alert v-if="error" type="error" class="mb-4" density="compact" rounded="lg" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <v-chip color="primary" variant="tonal" class="mb-4" size="default">
          <v-icon start size="small">mdi-door</v-icon>
          {{ roomName }}
        </v-chip>

        <div class="mb-4 d-flex align-center ga-2">
          <v-icon size="small" color="grey">mdi-calendar</v-icon>
          <span class="text-body-1 font-weight-medium">{{ startDateFormatted }}</span>
        </div>

        <v-select
          v-if="authStore.isSuperUser && userOptions.length > 0"
          v-model="selectedUserId"
          :items="userOptions"
          :label="t('booking.bookFor')"
          :loading="loadingUsers"
          density="compact"
          class="mb-2"
        />

        <v-select
          v-model="startTimeSlot"
          :items="startTimeOptions"
          :label="t('booking.startTime')"
          density="compact"
          class="mb-2"
        />

        <v-select
          v-model="endTimeSlot"
          :items="endTimeOptions"
          :label="t('booking.endTime')"
          density="compact"
        />

        <v-checkbox
          v-model="isRecurring"
          :label="t('booking.recurring')"
          density="compact"
          hide-details
          color="primary"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" rounded="lg" :disabled="props.loading" @click="emit('update:modelValue', false)">
          {{ t('booking.cancelAction') }}
        </v-btn>
        <v-btn color="primary" variant="flat" rounded="lg" :loading="props.loading" :disabled="props.loading" @click="handleConfirm">
          {{ t('booking.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
