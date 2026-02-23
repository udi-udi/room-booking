<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocationsStore } from '@/stores/locations'
import { useBookingsStore } from '@/stores/bookings'
import { useAuthStore } from '@/stores/auth'
import { useAdminCompanyStore } from '@/stores/adminCompany'
import { useNotificationStore } from '@/stores/notification'
import BookingModal from './BookingModal.vue'
import type { Booking } from '@/types/booking.types'
import type { Room } from '@/types/location.types'

const { t, locale } = useI18n()
const locationsStore = useLocationsStore()
const bookingsStore = useBookingsStore()
const authStore = useAuthStore()
const adminCompanyStore = useAdminCompanyStore()
const notificationStore = useNotificationStore()

// Week navigation
const currentDate = ref(new Date())

const weekStartDay = computed(() => authStore.user?.weekStartDay ?? 0)

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day - weekStartDay.value + 7) % 7
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const weekStart = computed(() => getWeekStart(currentDate.value))

const weekDays = computed(() => {
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
})

const weekEnd = computed(() => {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 7)
  return d
})

function prevWeek() {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() - 7)
  currentDate.value = d
}

function nextWeek() {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() + 7)
  currentDate.value = d
}

function goToday() {
  currentDate.value = new Date()
  selectedDayIndex.value = todayDayIndex()
}

// Day-level navigation within the week
function todayDayIndex(): number {
  const today = new Date()
  const day = today.getDay()
  const diff = (day - weekStartDay.value + 7) % 7
  return Math.max(0, Math.min(6, diff))
}

const selectedDayIndex = ref(todayDayIndex())
const selectedDay = computed(() => weekDays.value[selectedDayIndex.value])

function prevDay() {
  if (selectedDayIndex.value > 0) {
    selectedDayIndex.value--
  }
}

function nextDay() {
  if (selectedDayIndex.value < 6) {
    selectedDayIndex.value++
  }
}

// Time slots: 08:00 - 22:00, 15-min intervals
const timeSlots = computed(() => {
  const slots: string[] = []
  for (let h = 8; h < 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    }
  }
  return slots
})

const rooms = computed(() => locationsStore.rooms)

// Fetch bookings when location or week changes
function loadBookings() {
  const loc = locationsStore.selectedLocation
  if (loc) {
    bookingsStore.fetchLocationBookings(
      loc.id,
      weekStart.value.toISOString(),
      weekEnd.value.toISOString(),
    )
  }
}

watch([() => locationsStore.selectedLocationId, weekStart], () => {
  loadBookings()
})

// Reset selected day when weekStartDay preference changes
watch(weekStartDay, () => {
  selectedDayIndex.value = todayDayIndex()
})

onMounted(() => {
  document.addEventListener('mouseup', onGlobalMouseUp)
  const companyId = authStore.isAdmin ? adminCompanyStore.selectedCompanyId || undefined : undefined
  if (locationsStore.locations.length === 0) {
    locationsStore.fetchLocations(companyId).then(() => loadBookings())
  } else {
    loadBookings()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', onGlobalMouseUp)
})

// Booking lookup: returns booking for a specific room, day, and time
function getBookingAt(room: Room, day: Date, timeSlot: string): Booking | null {
  const [h, m] = timeSlot.split(':').map(Number)
  const slotStart = new Date(day)
  slotStart.setHours(h, m, 0, 0)
  const slotEnd = new Date(slotStart.getTime() + 15 * 60 * 1000)

  return bookingsStore.bookings.find((b) => {
    if (b.roomId !== room.id) return false
    const bStart = new Date(b.startTime)
    const bEnd = new Date(b.endTime)
    return bStart < slotEnd && bEnd > slotStart
  }) ?? null
}

function isOwnBooking(booking: Booking): boolean {
  return booking.userId === authStore.user?.id
}

function canDeleteBooking(booking: Booking): boolean {
  return authStore.isSuperUser || isOwnBooking(booking)
}

function isPastSlot(day: Date, timeSlot: string): boolean {
  const [h, m] = timeSlot.split(':').map(Number)
  const slotTime = new Date(day)
  slotTime.setHours(h, m, 0, 0)
  return slotTime < new Date()
}

function isFirstSlotOfBooking(booking: Booking, day: Date, timeSlot: string): boolean {
  const [h, m] = timeSlot.split(':').map(Number)
  const slotStart = new Date(day)
  slotStart.setHours(h, m, 0, 0)
  const bStart = new Date(booking.startTime)
  return bStart.getTime() === slotStart.getTime()
}

function bookingSpan(booking: Booking): number {
  const durationMs = new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()
  return Math.round(durationMs / (15 * 60 * 1000))
}

// Drag-to-select state
const isDragging = ref(false)
const dragRoom = ref<Room | null>(null)
const dragDay = ref<Date | null>(null)
const dragStartIndex = ref(0)
const dragCurrentIndex = ref(0)

function getMaxDragIndex(room: Room, day: Date, fromIndex: number, direction: 1 | -1): number {
  let idx = fromIndex
  while (true) {
    const next = idx + direction
    if (next < 0 || next >= timeSlots.value.length) break
    const nextSlot = timeSlots.value[next]
    if (isPastSlot(day, nextSlot)) break
    if (getBookingAt(room, day, nextSlot)) break
    idx = next
  }
  return idx
}

function isInSelection(room: Room, day: Date, slotIndex: number): boolean {
  if (!isDragging.value || !dragRoom.value || !dragDay.value) return false
  if (room.id !== dragRoom.value.id) return false
  if (day.toDateString() !== dragDay.value.toDateString()) return false
  const minIdx = Math.min(dragStartIndex.value, dragCurrentIndex.value)
  const maxIdx = Math.max(dragStartIndex.value, dragCurrentIndex.value)
  return slotIndex >= minIdx && slotIndex <= maxIdx
}

function onCellMouseDown(room: Room, day: Date, slotIndex: number) {
  const slot = timeSlots.value[slotIndex]
  if (isPastSlot(day, slot)) return
  if (getBookingAt(room, day, slot)) return

  isDragging.value = true
  dragRoom.value = room
  dragDay.value = day
  dragStartIndex.value = slotIndex
  dragCurrentIndex.value = slotIndex
}

function onCellMouseMove(room: Room, day: Date, slotIndex: number) {
  if (!isDragging.value || !dragRoom.value || !dragDay.value) return
  if (room.id !== dragRoom.value.id) return
  if (day.toDateString() !== dragDay.value.toDateString()) return

  // Constrain to not cross bookings
  const direction = slotIndex >= dragStartIndex.value ? 1 : -1
  const maxAllowed = getMaxDragIndex(dragRoom.value, dragDay.value, dragStartIndex.value, direction as 1 | -1)
  if (direction === 1) {
    dragCurrentIndex.value = Math.min(slotIndex, maxAllowed)
  } else {
    dragCurrentIndex.value = Math.max(slotIndex, maxAllowed)
  }
}

function onCellMouseUp() {
  if (!isDragging.value || !dragRoom.value || !dragDay.value) return

  const minIdx = Math.min(dragStartIndex.value, dragCurrentIndex.value)
  const maxIdx = Math.max(dragStartIndex.value, dragCurrentIndex.value)

  const [sh, sm] = timeSlots.value[minIdx].split(':').map(Number)
  const start = new Date(dragDay.value)
  start.setHours(sh, sm, 0, 0)

  // End time is one slot after the last selected slot
  const endSlotIdx = maxIdx + 1
  let end: Date
  if (endSlotIdx < timeSlots.value.length) {
    const [eh, em] = timeSlots.value[endSlotIdx].split(':').map(Number)
    end = new Date(dragDay.value)
    end.setHours(eh, em, 0, 0)
  } else {
    // Past last slot, end at 22:00
    end = new Date(dragDay.value)
    end.setHours(22, 0, 0, 0)
  }

  selectedRoom.value = dragRoom.value
  selectedStartTime.value = start
  selectedEndTime.value = end
  showBookingModal.value = true

  resetDrag()
}

function onGlobalMouseUp() {
  if (isDragging.value) {
    onCellMouseUp()
  }
}

function resetDrag() {
  isDragging.value = false
  dragRoom.value = null
  dragDay.value = null
  dragStartIndex.value = 0
  dragCurrentIndex.value = 0
}

// Booking modal
const showBookingModal = ref(false)
const selectedRoom = ref<Room | null>(null)
const selectedStartTime = ref(new Date())
const selectedEndTime = ref<Date | null>(null)

async function handleBookingConfirm(data: {
  roomId: string
  startTime: string
  endTime: string
  isRecurring: boolean
  recurrencePattern?: 'weekly'
  userId?: string
}) {
  try {
    await bookingsStore.createBooking(data)
    showBookingModal.value = false
    notificationStore.showSuccess(t('common.success'))
    loadBookings()
  } catch {
    // Error toast handled by API interceptor
  }
}

// Cancel booking
const showCancelDialog = ref(false)
const cancelTarget = ref<Booking | null>(null)

function openCancelDialog(booking: Booking) {
  cancelTarget.value = booking
  showCancelDialog.value = true
}

async function confirmCancel() {
  if (!cancelTarget.value) return
  try {
    await bookingsStore.deleteBooking(cancelTarget.value.id)
    showCancelDialog.value = false
    cancelTarget.value = null
    notificationStore.showSuccess(t('common.success'))
    loadBookings()
  } catch {
    // Error toast handled by API interceptor
  }
}

// Formatting
function formatDayHeader(day: Date): string {
  return day.toLocaleDateString(locale.value === 'he' ? 'he-IL' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

const isRtl = computed(() => locale.value === 'he')
const iconPrev = computed(() => isRtl.value ? 'mdi-chevron-right' : 'mdi-chevron-left')
const iconNext = computed(() => isRtl.value ? 'mdi-chevron-left' : 'mdi-chevron-right')

function isToday(day: Date): boolean {
  const now = new Date()
  return day.getDate() === now.getDate() &&
    day.getMonth() === now.getMonth() &&
    day.getFullYear() === now.getFullYear()
}
</script>

<template>
  <div>
    <!-- Week navigation -->
    <v-card rounded="xl" elevation="1" class="mb-4 pa-3">
      <div class="week-nav">
        <v-btn :icon="iconPrev" variant="text" size="small" rounded="lg" @click="prevWeek" />
        <v-btn variant="tonal" size="small" rounded="pill" class="mx-2 text-none" @click="goToday">
          {{ t('calendar.today') }}
        </v-btn>
        <v-btn :icon="iconNext" variant="text" size="small" rounded="lg" @click="nextWeek" />
        <span class="text-body-2 text-medium-emphasis ms-3">
          {{ weekStart.toLocaleDateString() }} &mdash; {{ weekDays[6].toLocaleDateString() }}
        </span>
        <v-spacer />
        <v-progress-circular v-if="bookingsStore.loading" indeterminate size="18" width="2" color="primary" />
      </div>

      <!-- Day pills -->
      <div class="day-nav mt-3">
        <v-btn :icon="iconPrev" variant="text" size="x-small" rounded="lg" :disabled="selectedDayIndex === 0" @click="prevDay" />
        <div class="day-tabs">
          <v-btn
            v-for="(day, idx) in weekDays"
            :key="day.toISOString()"
            :variant="idx === selectedDayIndex ? 'flat' : 'text'"
            :color="idx === selectedDayIndex ? 'primary' : undefined"
            size="small"
            rounded="pill"
            :class="{ 'day-tab-today': isToday(day) && idx !== selectedDayIndex }"
            class="day-tab text-none"
            @click="selectedDayIndex = idx"
          >
            {{ formatDayHeader(day) }}
          </v-btn>
        </div>
        <v-btn :icon="iconNext" variant="text" size="x-small" rounded="lg" :disabled="selectedDayIndex === 6" @click="nextDay" />
      </div>
    </v-card>

    <div v-if="rooms.length === 0" class="text-center pa-12 text-medium-emphasis">
      <v-icon size="48" class="mb-3" color="grey-lighten-1">mdi-calendar-blank-outline</v-icon>
      <div class="text-body-1">{{ t('calendar.noRooms') }}</div>
    </div>

    <!-- Calendar grid for selected day -->
    <v-card v-if="selectedDay && rooms.length > 0" rounded="xl" elevation="1" class="calendar-card">
      <div class="calendar-scroll-wrapper">
        <div class="calendar-grid" :style="{ gridTemplateColumns: `56px repeat(${rooms.length}, 1fr)` }">
          <!-- Header row: room names -->
          <div class="calendar-header-cell calendar-header-corner" />
          <div
            v-for="room in rooms"
            :key="room.id"
            class="calendar-header-cell text-caption font-weight-bold text-truncate"
          >
            {{ room.name }}
          </div>

          <!-- Time rows -->
          <template v-for="(slot, slotIdx) in timeSlots" :key="slot">
            <div class="calendar-time-cell text-caption">
              {{ slot }}
            </div>
            <div
              v-for="room in rooms"
              :key="`${room.id}-${slot}`"
              class="calendar-cell"
              :class="{
                'cell-past': isPastSlot(selectedDay, slot),
                'cell-own': getBookingAt(room, selectedDay, slot) && isOwnBooking(getBookingAt(room, selectedDay, slot)!),
                'cell-other': getBookingAt(room, selectedDay, slot) && !isOwnBooking(getBookingAt(room, selectedDay, slot)!) && !authStore.isSuperUser,
                'cell-other-deletable': getBookingAt(room, selectedDay, slot) && !isOwnBooking(getBookingAt(room, selectedDay, slot)!) && authStore.isSuperUser,
                'cell-available': !getBookingAt(room, selectedDay, slot) && !isPastSlot(selectedDay, slot),
                'cell-selecting': isInSelection(room, selectedDay, slotIdx),
                'cell-hour-border': slot.endsWith(':00'),
              }"
              @mousedown.prevent="onCellMouseDown(room, selectedDay, slotIdx)"
              @mousemove="onCellMouseMove(room, selectedDay, slotIdx)"
              @mouseup="onCellMouseUp()"
            >
              <template v-if="getBookingAt(room, selectedDay, slot) && isFirstSlotOfBooking(getBookingAt(room, selectedDay, slot)!, selectedDay, slot)">
                <div
                  class="booking-chip"
                  :style="{ height: `${bookingSpan(getBookingAt(room, selectedDay, slot)!) * 28}px`, backgroundColor: getBookingAt(room, selectedDay, slot)!.user.color }"
                  @click.stop="canDeleteBooking(getBookingAt(room, selectedDay, slot)!) ? openCancelDialog(getBookingAt(room, selectedDay, slot)!) : null"
                >
                  <span class="booking-chip-text">
                    {{ getBookingAt(room, selectedDay, slot)!.user.firstName }} {{ getBookingAt(room, selectedDay, slot)!.user.lastName[0] }}.
                  </span>
                </div>
                <v-tooltip activator="parent" location="top">
                  {{ getBookingAt(room, selectedDay, slot)!.user.firstName }}
                  {{ getBookingAt(room, selectedDay, slot)!.user.lastName }}
                  &mdash;
                  {{ new Date(getBookingAt(room, selectedDay, slot)!.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}
                  -
                  {{ new Date(getBookingAt(room, selectedDay, slot)!.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}
                </v-tooltip>
              </template>
            </div>
          </template>
        </div>
      </div>
    </v-card>

    <!-- Booking creation modal -->
    <BookingModal
      v-if="selectedRoom"
      v-model="showBookingModal"
      :room-id="selectedRoom.id"
      :room-name="selectedRoom.name"
      :start-time="selectedStartTime"
      :end-time="selectedEndTime"
      :location-id="locationsStore.selectedLocationId ?? ''"
      @confirm="handleBookingConfirm"
    />

    <!-- Cancel confirmation dialog -->
    <v-dialog v-model="showCancelDialog" max-width="380">
      <v-card class="pa-2">
        <v-card-title class="text-h6">{{ t('booking.cancel') }}</v-card-title>
        <v-card-text class="text-body-1">
          {{ t('common.confirm') }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="showCancelDialog = false">
            {{ t('booking.cancelAction') }}
          </v-btn>
          <v-btn color="error" variant="flat" rounded="lg" @click="confirmCancel">
            {{ t('booking.cancel') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.week-nav {
  display: flex;
  align-items: center;
}

.day-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.day-tabs {
  display: flex;
  flex: 1;
  overflow-x: auto;
  gap: 4px;
  scrollbar-width: none;
}

.day-tabs::-webkit-scrollbar {
  display: none;
}

.day-tab {
  flex-shrink: 0;
  letter-spacing: normal !important;
  font-size: 0.8rem !important;
}

.day-tab-today {
  font-weight: 700 !important;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.calendar-card {
  overflow: hidden;
}

.calendar-scroll-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.calendar-grid {
  min-width: 600px;
  display: grid;
  user-select: none;
}

.calendar-header-cell {
  padding: 10px 8px;
  background: linear-gradient(to bottom, #f8f9fc, #f0f2f8);
  border-bottom: 2px solid #e8eaf0;
  border-inline-end: 1px solid #e8eaf0;
  text-align: center;
  min-height: 36px;
  color: #5C6BC0;
}

.calendar-header-corner {
  border-start-start-radius: 0;
}

.calendar-time-cell {
  padding: 2px 6px;
  border-bottom: 1px solid #f0f0f0;
  border-inline-end: 1px solid #e8eaf0;
  text-align: end;
  color: #9e9e9e;
  min-height: 28px;
  line-height: 28px;
  font-size: 0.75rem;
}

.calendar-cell {
  position: relative;
  border-bottom: 1px solid #f5f5f5;
  border-inline-end: 1px solid #f0f0f0;
  min-height: 28px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.cell-hour-border {
  border-bottom-color: #e0e0e0;
}

.cell-available:hover {
  background-color: #ede7f6;
}

.cell-selecting {
  background-color: #c5cae9 !important;
}

.cell-past {
  background-color: #fafafa;
  cursor: default;
}

.cell-own {
  cursor: pointer;
}

.cell-other {
  cursor: default;
}

.cell-other-deletable {
  cursor: pointer;
}

.booking-chip {
  position: absolute;
  top: 1px;
  inset-inline-start: 2px;
  inset-inline-end: 2px;
  border-radius: 8px;
  z-index: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.92;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  transition: opacity 0.15s ease, box-shadow 0.15s ease;
}

.booking-chip:hover {
  opacity: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.booking-chip-text {
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  text-align: center;
  padding: 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  width: 100%;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
</style>
