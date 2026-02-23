<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocale } from 'vuetify'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const { t, locale } = useI18n()
const { current: vuetifyLocale } = useLocale()
const router = useRouter()
const authStore = useAuthStore()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const companyName = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

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

const requiredRule = (label: string) => (v: string) => !!v || label
const emailRules = [
  (v: string) => !!v || t('auth.emailRequired'),
  (v: string) => /.+@.+\..+/.test(v) || t('auth.invalidEmail'),
]
const passwordRules = [
  (v: string) => !!v || t('auth.passwordMinLength'),
  (v: string) => v.length >= 8 || t('auth.passwordMinLength'),
]

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    await authStore.register({
      email: email.value,
      password: password.value,
      firstName: firstName.value,
      lastName: lastName.value,
      companyName: companyName.value,
    })
    router.push('/calendar')
  } catch (e: unknown) {
    const axiosError = e as { response?: { data?: { error?: string | { message?: string } } } }
    const errData = axiosError.response?.data?.error
    if (typeof errData === 'string') {
      error.value = errData
    } else if (errData && typeof errData === 'object' && 'message' in errData) {
      error.value = (errData as { message: string }).message
    } else {
      error.value = t('auth.registerFailed')
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
            <h2 class="text-h6 mb-4">{{ t('auth.register') }}</h2>

            <v-alert v-if="error" type="error" class="mb-4" density="compact" rounded="lg" closable @click:close="error = ''">
              {{ error }}
            </v-alert>
            <v-form @submit.prevent="handleRegister">
              <v-text-field
                v-model="companyName"
                :label="t('admin.companyName')"
                prepend-inner-icon="mdi-office-building-outline"
                :rules="[requiredRule(t('admin.companyName'))]"
                required
                autocomplete="organization"
                density="comfortable"
              />
              <v-row dense>
                <v-col cols="6">
                  <v-text-field
                    v-model="firstName"
                    :label="t('auth.firstName')"
                    prepend-inner-icon="mdi-account-outline"
                    :rules="[requiredRule(t('auth.firstNameRequired'))]"
                    required
                    autocomplete="given-name"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="lastName"
                    :label="t('auth.lastName')"
                    :rules="[requiredRule(t('auth.lastNameRequired'))]"
                    required
                    autocomplete="family-name"
                    density="comfortable"
                  />
                </v-col>
              </v-row>
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
                :hint="t('auth.passwordMinLength')"
                required
                autocomplete="new-password"
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
                :disabled="!companyName || !firstName || !lastName || !email || !password"
                class="mt-2 text-none"
              >
                {{ t('auth.signUp') }}
              </v-btn>
            </v-form>

            <p class="text-center mt-5 text-body-2">
              {{ t('auth.hasAccount') }}
              <router-link to="/login" class="text-primary font-weight-medium">{{ t('auth.signIn') }}</router-link>
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
