import { defineStore } from 'pinia'
import { ref } from 'vue'

type NotificationType = 'success' | 'error' | 'info'

export const useNotificationStore = defineStore('notification', () => {
  const message = ref('')
  const type = ref<NotificationType>('info')
  const show = ref(false)

  let hideTimeout: ReturnType<typeof setTimeout> | null = null

  function showNotification(msg: string, notifType: NotificationType, autoHideMs?: number) {
    if (hideTimeout) clearTimeout(hideTimeout)
    message.value = msg
    type.value = notifType
    show.value = true

    if (autoHideMs) {
      hideTimeout = setTimeout(() => {
        show.value = false
      }, autoHideMs)
    }
  }

  function showSuccess(msg: string) {
    showNotification(msg, 'success', 4000)
  }

  function showError(msg: string) {
    showNotification(msg, 'error')
  }

  function showInfo(msg: string) {
    showNotification(msg, 'info', 4000)
  }

  function hide() {
    show.value = false
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
  }

  return {
    message,
    type,
    show,
    showSuccess,
    showError,
    showInfo,
    hide,
  }
})
