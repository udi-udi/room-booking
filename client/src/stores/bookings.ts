import { defineStore } from 'pinia'
import { ref } from 'vue'
import { bookingService } from '@/services/bookingService'
import type { Booking, CreateBookingData } from '@/types/booking.types'

export const useBookingsStore = defineStore('bookings', () => {
  const bookings = ref<Booking[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const lastQuery = ref<{ locationId: string; start: string; end: string } | null>(null)

  async function fetchLocationBookings(locationId: string, start: string, end: string) {
    lastQuery.value = { locationId, start, end }
    loading.value = true
    error.value = null
    try {
      bookings.value = await bookingService.getLocationBookings(locationId, start, end)
    } catch (e: unknown) {
      const axiosError = e as { response?: { data?: { error?: { message?: string } | string } } }
      const errData = axiosError.response?.data?.error
      error.value = typeof errData === 'string' ? errData : (errData as { message?: string })?.message ?? 'Failed to load bookings'
    } finally {
      loading.value = false
    }
  }

  async function refetch() {
    if (lastQuery.value) {
      await fetchLocationBookings(lastQuery.value.locationId, lastQuery.value.start, lastQuery.value.end)
    }
  }

  async function createBooking(data: CreateBookingData) {
    const booking = await bookingService.createBooking(data)
    bookings.value.push(booking)
    // If recurring, also push child bookings
    if (booking.childBookings) {
      bookings.value.push(...booking.childBookings)
    }
    return booking
  }

  async function deleteBooking(id: string) {
    await bookingService.deleteBooking(id)
    bookings.value = bookings.value.filter((b) => b.id !== id && b.parentBookingId !== id)
  }

  function reset() {
    bookings.value = []
    error.value = null
  }

  return {
    bookings,
    loading,
    error,
    fetchLocationBookings,
    refetch,
    createBooking,
    deleteBooking,
    reset,
  }
})
