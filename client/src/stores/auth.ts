import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/authService'
import type { User, LoginCredentials, RegisterData } from '@/types/auth.types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isSuperUser = computed(() => user.value?.role === 'super_user' || user.value?.role === 'admin')
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setTokens(accessToken: string, newRefreshToken: string) {
    token.value = accessToken
    refreshToken.value = newRefreshToken
    localStorage.setItem('token', accessToken)
    localStorage.setItem('refreshToken', newRefreshToken)
  }

  function clearAuth() {
    user.value = null
    token.value = null
    refreshToken.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }

  async function login(credentials: LoginCredentials) {
    loading.value = true
    try {
      const tokens = await authService.login(credentials)
      setTokens(tokens.accessToken, tokens.refreshToken)
      const profile = await authService.getProfile()
      user.value = profile
    } finally {
      loading.value = false
    }
  }

  async function register(data: RegisterData) {
    loading.value = true
    try {
      const tokens = await authService.register(data)
      setTokens(tokens.accessToken, tokens.refreshToken)
      const profile = await authService.getProfile()
      user.value = profile
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await authService.logout()
    } catch {
      // Ignore logout API errors
    }
    clearAuth()
  }

  async function initialize() {
    if (!token.value) return
    loading.value = true
    try {
      const profile = await authService.getProfile()
      user.value = profile
    } catch {
      clearAuth()
    } finally {
      loading.value = false
    }
  }

  async function refreshProfile() {
    try {
      const profile = await authService.getProfile()
      user.value = profile
    } catch {
      // ignore
    }
  }

  async function doRefreshToken(): Promise<boolean> {
    if (!refreshToken.value) return false
    try {
      const tokens = await authService.refreshToken(refreshToken.value)
      setTokens(tokens.accessToken, tokens.refreshToken)
      return true
    } catch {
      clearAuth()
      return false
    }
  }

  return {
    user,
    token,
    refreshToken,
    loading,
    isAuthenticated,
    isSuperUser,
    isAdmin,
    login,
    register,
    logout,
    initialize,
    refreshProfile,
    setTokens,
    clearAuth,
    doRefreshToken,
  }
})
