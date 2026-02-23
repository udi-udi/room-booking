<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocale } from 'vuetify'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const { t, locale } = useI18n()
const { current: vuetifyLocale } = useLocale()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

const emailRules = [
  (v: string) => !!v || t('auth.emailRequired'),
  (v: string) => /.+@.+\..+/.test(v) || t('auth.invalidEmail'),
]
const passwordRules = [
  (v: string) => !!v || t('auth.passwordMinLength'),
]

onMounted(async () => {
  const accessToken = route.query.accessToken as string
  const refreshToken = route.query.refreshToken as string
  if (accessToken && refreshToken) {
    authStore.setTokens(accessToken, refreshToken)
    await authStore.initialize()
    router.replace('/calendar')
  }
})

const languageOptions = [
  { title: 'English', value: 'en' },
  { title: 'עברית', value: 'he' },
]

function setLanguage(lang: string) {
  locale.value = lang
  vuetifyLocale.value = lang
  localStorage.setItem('locale', lang)
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
}

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await authStore.login({ email: email.value, password: password.value })
    router.push('/calendar')
  } catch (e: unknown) {
    const axiosError = e as { response?: { data?: { error?: string | { message?: string } } } }
    const errData = axiosError.response?.data?.error
    if (typeof errData === 'string') {
      error.value = errData
    } else if (errData && typeof errData === 'object' && 'message' in errData) {
      error.value = (errData as { message: string }).message
    } else {
      error.value = t('auth.loginFailed')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <div class="d-flex justify-end mb-2">
          <v-select
            :model-value="locale"
            :items="languageOptions"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-translate"
            style="max-width: 160px"
            @update:model-value="setLanguage"
          />
        </div>

        <div class="text-center mb-6">
          <v-icon size="56" color="primary">mdi-calendar-clock</v-icon>
          <h1 class="text-h5 font-weight-bold mt-2">{{ t('app.title') }}</h1>
        </div>

        <v-card class="pa-4">
          <v-card-text>
            <h2 class="text-h6 mb-4">{{ t('auth.login') }}</h2>

            <v-alert v-if="error" type="error" class="mb-4" density="compact" rounded="lg" closable @click:close="error = ''">
              {{ error }}
            </v-alert>

            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="email"
                :label="t('auth.email')"
                type="email"
                prepend-inner-icon="mdi-email-outline"
                :rules="emailRules"
                required
                autocomplete="email"
                density="comfortable"
              />
              <v-text-field
                v-model="password"
                :label="t('auth.password')"
                :type="showPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                :rules="passwordRules"
                required
                autocomplete="current-password"
                density="comfortable"
                @click:append-inner="showPassword = !showPassword"
              />
              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                rounded="lg"
                :loading="loading"
                :disabled="!email || !password"
                class="mt-2 text-none"
              >
                {{ t('auth.signIn') }}
              </v-btn>
            </v-form>

            <p class="text-center mt-5 text-body-2">
              {{ t('auth.noAccount') }}
              <router-link to="/register" class="text-primary font-weight-medium">{{ t('auth.signUp') }}</router-link>
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* Hide resting label when browser autofills inputs */
:deep(.v-field:has(input:-webkit-autofill)) .v-field-label:not(.v-field-label--floating),
:deep(.v-field:has(input:autofill)) .v-field-label:not(.v-field-label--floating) {
  opacity: 0;
}
</style>
