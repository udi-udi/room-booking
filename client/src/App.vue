<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocale, useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { useLocationsStore } from '@/stores/locations'
import { useBookingsStore } from '@/stores/bookings'
import { useAdminCompanyStore } from '@/stores/adminCompany'
import { useNotificationStore } from '@/stores/notification'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import LocationSelector from '@/components/layout/LocationSelector.vue'
import { isColorBright } from '@/utils/colorUtils'

const { t, locale } = useI18n()
const router = useRouter()
const { current: vuetifyLocale } = useLocale()
const theme = useTheme()
const authStore = useAuthStore()
const locationsStore = useLocationsStore()
const bookingsStore = useBookingsStore()
const adminCompanyStore = useAdminCompanyStore()
const notificationStore = useNotificationStore()

const isRtl = computed(() => locale.value === 'he')
const userPropsDialog = ref(false)
const userSettingsTab = ref('profile')
const userColorPick = ref('#1976D2')
const userFirstName = ref('')
const userLastName = ref('')
const userWeekStartDay = ref(0)
const userLanguage = ref(locale.value)

// Forced initial password setup
const initialPassword = ref('')
const initialPasswordConfirm = ref('')
const initialPasswordSaving = ref(false)
const showInitialPassword = ref(false)
const showInitialPasswordConfirm = ref(false)

const mustChangePassword = computed(() => authStore.user?.mustChangePassword === true)

const initialPasswordMismatch = computed(() =>
  initialPasswordConfirm.value !== '' && initialPassword.value !== initialPasswordConfirm.value,
)

const canSetInitialPassword = computed(() =>
  initialPassword.value.length >= 8 &&
  initialPassword.value === initialPasswordConfirm.value,
)

async function handleSetInitialPassword() {
  if (!canSetInitialPassword.value) return
  initialPasswordSaving.value = true
  try {
    await authService.forceChangePassword(initialPassword.value)
    await authStore.refreshProfile()
    initialPassword.value = ''
    initialPasswordConfirm.value = ''
    notificationStore.showSuccess(t('admin.passwordChanged'))
  } catch {
    // error handled by interceptor
  } finally {
    initialPasswordSaving.value = false
  }
}

// Password change
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordSaving = ref(false)

const weekStartDayOptions = computed(() => [
  { title: t('admin.sunday'), value: 0 },
  { title: t('admin.monday'), value: 1 },
  { title: t('admin.saturday'), value: 6 },
])

// For admins, show the selected company's info; for others, show their own company
const companyLogo = computed(() => {
  if (authStore.isAdmin && adminCompanyStore.selectedCompanyDetail) {
    return adminCompanyStore.selectedCompanyDetail.logo || null
  }
  return authStore.user?.company?.logo || null
})
const companyName = computed(() => {
  if (authStore.isAdmin && adminCompanyStore.selectedCompanyDetail) {
    return adminCompanyStore.selectedCompanyDetail.name || ''
  }
  return authStore.user?.company?.name || ''
})

const companyColor = computed(() => {
  if (authStore.isAdmin && adminCompanyStore.selectedCompanyDetail?.color) {
    return adminCompanyStore.selectedCompanyDetail.color
  }
  return authStore.user?.company?.color || '#1976D2'
})
const companyTextColor = computed(() => isColorBright(companyColor.value) ? '#000000' : '#ffffff')
const userInitialsColor = computed(() => isColorBright(authStore.user?.color || '#1976D2') ? '#000000' : '#ffffff')

// Apply company color as theme primary
function applyCompanyColor() {
  if (authStore.isAdmin && adminCompanyStore.selectedCompanyDetail?.color) {
    theme.themes.value.light.colors.primary = adminCompanyStore.selectedCompanyDetail.color
  } else if (authStore.user?.company?.color) {
    theme.themes.value.light.colors.primary = authStore.user.company.color
  }
}

watch(() => authStore.user?.company?.color, () => applyCompanyColor(), { immediate: true })
watch(() => adminCompanyStore.selectedCompanyDetail, () => applyCompanyColor())

// When admin switches company, reload company detail, locations and bookings
watch(() => adminCompanyStore.selectedCompanyId, async (id) => {
  if (authStore.isAdmin && id) {
    await adminCompanyStore.loadSelectedCompanyDetail()
    applyCompanyColor()
    locationsStore.reset()
    await locationsStore.fetchLocations(id)
    bookingsStore.refetch()
  }
})

// Sync user props with store
watch(() => authStore.user, (u) => {
  if (u) {
    userColorPick.value = u.color || '#1976D2'
    userFirstName.value = u.firstName || ''
    userLastName.value = u.lastName || ''
    userWeekStartDay.value = u.weekStartDay ?? 0
    userLanguage.value = locale.value
  }
}, { immediate: true })

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

watch(locale, (val) => {
  vuetifyLocale.value = val
  document.documentElement.dir = val === 'he' ? 'rtl' : 'ltr'
  document.documentElement.lang = val
}, { immediate: true })

const navItems = computed(() => [
  { title: t('nav.calendar'), icon: 'mdi-calendar', to: '/calendar' },
])

const adminItems = computed(() => [
  { title: t('nav.company'), icon: 'mdi-office-building', to: '/admin/company' },
  { title: t('nav.locations'), icon: 'mdi-map-marker', to: '/admin/locations' },
  { title: t('nav.users'), icon: 'mdi-account-group', to: '/admin/users' },
])

async function handleLogout() {
  await authStore.logout()
  locationsStore.reset()
  adminCompanyStore.reset()
  router.push('/login')
}

async function saveUserProps() {
  try {
    await authService.updateMyProfile({
      firstName: userFirstName.value.trim(),
      lastName: userLastName.value.trim(),
      color: userColorPick.value,
      weekStartDay: userWeekStartDay.value,
    })
    setLanguage(userLanguage.value)
    await authStore.refreshProfile()
    userPropsDialog.value = false
    // Refresh calendar bookings so the new color/name shows immediately
    await bookingsStore.refetch()
  } catch {
    // error handled by interceptor
  }
}

const passwordMismatch = computed(() =>
  confirmPassword.value !== '' && newPassword.value !== confirmPassword.value,
)

const canChangePassword = computed(() =>
  currentPassword.value.length > 0 &&
  newPassword.value.length >= 8 &&
  newPassword.value === confirmPassword.value,
)

async function savePassword() {
  if (!canChangePassword.value) return
  passwordSaving.value = true
  try {
    await authService.changePassword(currentPassword.value, newPassword.value)
    notificationStore.showSuccess(t('admin.passwordChanged'))
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    userPropsDialog.value = false
  } catch {
    // error handled by interceptor
  } finally {
    passwordSaving.value = false
  }
}
</script>

<template>
  <v-app :rtl="isRtl">
    <template v-if="authStore.isAuthenticated">
      <v-app-bar color="primary" density="comfortable" elevation="0" class="app-bar-rounded" :style="{ '--topbar-text-color': companyTextColor }">
        <!-- Company logo or name -->
        <template #prepend>
          <img
            v-if="companyLogo"
            :src="companyLogo"
            alt="Company Logo"
            class="company-logo ms-3"
          />
          <span v-else class="company-name ms-3 font-weight-bold" :style="{ color: companyTextColor }">{{ companyName }}</span>
        </template>

        <LocationSelector class="ms-4 topbar-select" />

        <!-- Admin company selector -->
        <v-select
          v-if="authStore.isAdmin"
          v-model="adminCompanyStore.selectedCompanyId"
          :items="adminCompanyStore.companyOptions"
          :label="t('admin.selectCompany')"
          density="compact"
          hide-details
          variant="solo-filled"
          rounded="pill"
          class="admin-company-select ms-4 topbar-select"
          bg-color="rgba(255,255,255,0.15)"
        />

        <v-spacer />

        <!-- User settings -->
        <v-btn icon variant="text" class="me-1" @click="userPropsDialog = true">
          <v-avatar size="28" :color="authStore.user?.color || '#1976D2'">
            <span class="text-caption font-weight-bold" :style="{ color: userInitialsColor }">
              {{ (authStore.user?.firstName?.[0] || '').toUpperCase() }}
            </span>
          </v-avatar>
          <v-tooltip activator="parent" location="bottom">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</v-tooltip>
        </v-btn>

        <v-dialog v-model="userPropsDialog" max-width="500">
          <v-card>
            <v-card-title class="text-subtitle-1">{{ t('admin.userProperties') }}</v-card-title>
            <v-tabs v-model="userSettingsTab" grow>
              <v-tab value="profile">{{ t('admin.profile') }}</v-tab>
              <v-tab value="preferences">{{ t('admin.preferences') }}</v-tab>
              <v-tab value="security">{{ t('admin.security') }}</v-tab>
            </v-tabs>
            <v-divider />
            <v-window v-model="userSettingsTab">
              <!-- Profile tab -->
              <v-window-item value="profile">
                <v-card-text>
                  <v-text-field
                    v-model="userFirstName"
                    :label="t('auth.firstName')"
                    density="compact"
                    class="mb-2"
                  />
                  <v-text-field
                    v-model="userLastName"
                    :label="t('auth.lastName')"
                    density="compact"
                    class="mb-2"
                  />
                  <v-select
                    v-model="userLanguage"
                    :items="languageOptions"
                    item-title="title"
                    item-value="value"
                    :label="t('app.language')"
                    density="compact"
                  />
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn variant="text" @click="userPropsDialog = false">{{ t('common.cancel') }}</v-btn>
                  <v-btn color="primary" @click="saveUserProps">{{ t('admin.save') }}</v-btn>
                </v-card-actions>
              </v-window-item>

              <!-- Preferences tab -->
              <v-window-item value="preferences">
                <v-card-text>
                  <v-select
                    v-model="userWeekStartDay"
                    :items="weekStartDayOptions"
                    :label="t('admin.weekStartDay')"
                    density="compact"
                    class="mb-2"
                  />
                  <div class="text-subtitle-2 mb-2">{{ t('admin.myColor') }}</div>
                  <v-color-picker
                    v-model="userColorPick"
                    mode="hexa"
                    show-swatches
                    hide-inputs
                    width="100%"
                  />
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn variant="text" @click="userPropsDialog = false">{{ t('common.cancel') }}</v-btn>
                  <v-btn color="primary" @click="saveUserProps">{{ t('admin.save') }}</v-btn>
                </v-card-actions>
              </v-window-item>

              <!-- Security tab -->
              <v-window-item value="security">
                <v-card-text>
                  <v-text-field
                    v-model="currentPassword"
                    :label="t('admin.currentPassword')"
                    type="password"
                    density="compact"
                    class="mb-2"
                  />
                  <v-text-field
                    v-model="newPassword"
                    :label="t('admin.newPassword')"
                    type="password"
                    density="compact"
                    :rules="[v => !v || v.length >= 8 || t('auth.passwordMinLength')]"
                    class="mb-2"
                  />
                  <v-text-field
                    v-model="confirmPassword"
                    :label="t('admin.confirmPassword')"
                    type="password"
                    density="compact"
                    :error-messages="passwordMismatch ? [t('admin.passwordMismatch')] : []"
                  />
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn variant="text" @click="userPropsDialog = false">{{ t('common.cancel') }}</v-btn>
                  <v-btn
                    color="primary"
                    :loading="passwordSaving"
                    :disabled="!canChangePassword"
                    @click="savePassword"
                  >
                    {{ t('admin.changePassword') }}
                  </v-btn>
                </v-card-actions>
              </v-window-item>
            </v-window>
          </v-card>
        </v-dialog>

        <v-btn icon variant="text" @click="handleLogout">
          <v-icon>mdi-logout</v-icon>
          <v-tooltip activator="parent" location="bottom">{{ t('nav.logout') }}</v-tooltip>
        </v-btn>
      </v-app-bar>

      <v-navigation-drawer elevation="0" class="nav-drawer-soft">
        <v-list nav density="compact" rounded="xl" class="pa-3">
          <v-list-item
            v-for="item in navItems"
            :key="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            :to="item.to"
            rounded="lg"
            class="mb-1"
          />

          <template v-if="authStore.isSuperUser">
            <v-divider class="my-3" />
            <v-list-subheader class="text-uppercase text-caption font-weight-bold">{{ t('nav.admin') }}</v-list-subheader>

            <v-list-item
              v-for="item in adminItems"
              :key="item.to"
              :prepend-icon="item.icon"
              :title="item.title"
              :to="item.to"
              rounded="lg"
              class="mb-1"
            />
          </template>

          <template v-if="authStore.isAdmin">
            <v-divider class="my-3" />
            <v-list-item
              prepend-icon="mdi-shield-crown"
              :title="t('nav.adminDashboard')"
              to="/admin/dashboard"
              rounded="lg"
            />
          </template>
        </v-list>
      </v-navigation-drawer>
    </template>

    <v-main>
      <v-container fluid class="pa-4 pa-md-6">
        <router-view />
      </v-container>
    </v-main>

    <!-- Forced Change Password Dialog (non-dismissible) -->
    <v-dialog :model-value="mustChangePassword" persistent max-width="450" no-click-animation>
      <v-card>
        <v-card-title>{{ t('auth.changePasswordTitle') }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="initialPassword"
            :label="t('admin.newPassword')"
            :type="showInitialPassword ? 'text' : 'password'"
            variant="outlined"
            autocomplete="off"
            :rules="[v => !v || v.length >= 8 || t('auth.passwordMinLength')]"
            :append-inner-icon="showInitialPassword ? 'mdi-eye-off' : 'mdi-eye'"
            class="mb-2"
            @click:append-inner="showInitialPassword = !showInitialPassword"
          />
          <v-text-field
            v-model="initialPasswordConfirm"
            :label="t('auth.confirmNewPassword')"
            :type="showInitialPasswordConfirm ? 'text' : 'password'"
            variant="outlined"
            autocomplete="off"
            :append-inner-icon="showInitialPasswordConfirm ? 'mdi-eye-off' : 'mdi-eye'"
            :error-messages="initialPasswordMismatch ? [t('admin.passwordMismatch')] : []"
            @click:append-inner="showInitialPasswordConfirm = !showInitialPasswordConfirm"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            :loading="initialPasswordSaving"
            :disabled="!canSetInitialPassword"
            @click="handleSetInitialPassword"
          >
            {{ t('admin.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="notificationStore.show"
      :color="notificationStore.type === 'error' ? 'error' : notificationStore.type === 'success' ? 'success' : 'info'"
      location="top"
      timeout="-1"
      rounded="lg"
      @update:model-value="(val: boolean) => { if (!val) notificationStore.hide() }"
    >
      {{ notificationStore.message }}
      <template #actions>
        <v-btn variant="text" @click="notificationStore.hide()">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<style>
.app-bar-rounded {
  border-bottom-left-radius: 16px !important;
  border-bottom-right-radius: 16px !important;
}

.nav-drawer-soft {
  background-color: rgb(var(--v-theme-background)) !important;
  border-inline-end: none !important;
}

.company-logo {
  max-height: 36px;
  max-width: 140px;
  object-fit: contain;
}

.company-name {
  font-size: 1.1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.admin-company-select {
  max-width: 220px;
  flex: 0 1 220px;
}


</style>

<style>
.topbar-select .v-select__selection-text,
.topbar-select .v-field__input input,
.topbar-select .v-field__append-inner .v-icon,
.topbar-select .v-label,
.topbar-select .v-field-label {
  color: var(--topbar-text-color) !important;
}
</style>
