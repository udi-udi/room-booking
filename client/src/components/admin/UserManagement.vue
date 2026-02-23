<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAdminCompanyStore } from '@/stores/adminCompany'
import { useNotificationStore } from '@/stores/notification'
import { userService } from '@/services/userService'
import { locationService } from '@/services/locationService'
import type { ManagedUser, InviteUserData } from '@/types/user.types'
import type { Location } from '@/types/location.types'

const { t } = useI18n()
const authStore = useAuthStore()
const adminCompanyStore = useAdminCompanyStore()
const notificationStore = useNotificationStore()

const users = ref<ManagedUser[]>([])
const allLocations = ref<Location[]>([])
const loading = ref(false)

// Invite dialog
const inviteDialog = ref(false)
const inviteData = ref<InviteUserData>({
  email: '',
  firstName: '',
  lastName: '',
  role: 'user',
})
const inviteLocationIds = ref<string[]>([])
const inviteSaving = ref(false)

// Edit dialog
const editDialog = ref(false)
const editingUser = ref<ManagedUser | null>(null)
const editFirstName = ref('')
const editLastName = ref('')
const editRole = ref<'user' | 'super_user' | 'admin'>('user')
const editPassword = ref('')
const editSaving = ref(false)

// Locations dialog
const locationsDialog = ref(false)
const locationsUserId = ref('')
const selectedLocationIds = ref<string[]>([])
const locationsSaving = ref(false)

// Reset password dialog
const resetPasswordDialog = ref(false)
const resetPasswordTargetUser = ref<ManagedUser | null>(null)
const resettingPassword = ref(false)

// OTP dialog (shows temporary password after invite or reset)
const otpDialog = ref(false)
const otpValue = ref('')

// Delete dialog
const deleteDialog = ref(false)
const deleteTargetUser = ref<ManagedUser | null>(null)
const deleting = ref(false)

// Validation rules
const requiredRule = (label: string) => (v: string) => !!v || label
const emailRules = [
  (v: string) => !!v || t('auth.emailRequired'),
  (v: string) => /.+@.+\..+/.test(v) || t('auth.invalidEmail'),
]

const roleOptions = computed(() => {
  const options = [
    { title: t('admin.roleUser'), value: 'user' },
    { title: t('admin.roleSuperUser'), value: 'super_user' },
  ]
  if (authStore.isAdmin) {
    options.push({ title: t('admin.roleAdmin'), value: 'admin' })
  }
  return options
})

onMounted(async () => {
  await Promise.all([fetchUsers(), fetchLocations()])
})

// When admin switches company in the top bar, reload users
watch(() => adminCompanyStore.selectedCompanyId, async () => {
  if (authStore.isAdmin) {
    await Promise.all([fetchUsers(), fetchLocations()])
  }
})

async function fetchUsers() {
  loading.value = true
  try {
    const companyId = authStore.isAdmin ? adminCompanyStore.selectedCompanyId || undefined : undefined
    users.value = await userService.getUsers(companyId)
  } catch {
    // Error toast handled by API interceptor
  } finally {
    loading.value = false
  }
}

async function fetchLocations() {
  try {
    allLocations.value = await locationService.getLocations()
  } catch {
    // Non-critical
  }
}

function openInvite() {
  inviteData.value = { email: '', firstName: '', lastName: '', role: 'user' }
  inviteLocationIds.value = []
  inviteDialog.value = true
}

async function handleInvite() {
  inviteSaving.value = true
  try {
    const payload: InviteUserData & { companyId?: string } = { ...inviteData.value }
    // Admin invites into the selected company
    if (authStore.isAdmin && adminCompanyStore.selectedCompanyId) {
      payload.companyId = adminCompanyStore.selectedCompanyId
    }
    const result = await userService.inviteUser(payload)
    if (inviteLocationIds.value.length > 0) {
      await userService.assignLocations(result.id, inviteLocationIds.value)
    }
    inviteDialog.value = false
    if (result.temporaryPassword) {
      otpValue.value = result.temporaryPassword
      otpDialog.value = true
    }
    await fetchUsers()
  } catch {
    // Error toast handled by API interceptor
  } finally {
    inviteSaving.value = false
  }
}

function openEdit(user: ManagedUser) {
  editingUser.value = user
  editFirstName.value = user.firstName
  editLastName.value = user.lastName
  editRole.value = user.role
  editPassword.value = ''
  editDialog.value = true
}

async function handleEdit() {
  if (!editingUser.value) return
  editSaving.value = true
  try {
    const updatePayload: { firstName: string; lastName: string; role: typeof editRole.value; password?: string } = {
      firstName: editFirstName.value,
      lastName: editLastName.value,
      role: editRole.value,
    }
    if (editPassword.value.trim()) {
      updatePayload.password = editPassword.value.trim()
    }
    await userService.updateUser(editingUser.value.id, updatePayload)
    editDialog.value = false
    notificationStore.showSuccess(t('common.success'))
    await fetchUsers()
  } catch {
    // Error toast handled by API interceptor
  } finally {
    editSaving.value = false
  }
}

function openLocations(user: ManagedUser) {
  locationsUserId.value = user.id
  selectedLocationIds.value = user.locations.map((l) => l.locationId)
  locationsDialog.value = true
}

async function handleAssignLocations() {
  locationsSaving.value = true
  try {
    await userService.assignLocations(locationsUserId.value, selectedLocationIds.value)
    locationsDialog.value = false
    notificationStore.showSuccess(t('common.success'))
    await fetchUsers()
  } catch {
    // Error toast handled by API interceptor
  } finally {
    locationsSaving.value = false
  }
}

function confirmDelete(user: ManagedUser) {
  deleteTargetUser.value = user
  deleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTargetUser.value) return
  deleting.value = true
  try {
    await userService.deleteUser(deleteTargetUser.value.id)
    deleteDialog.value = false
    deleteTargetUser.value = null
    notificationStore.showSuccess(t('common.success'))
    await fetchUsers()
  } catch {
    // Error toast handled by API interceptor
  } finally {
    deleting.value = false
  }
}

function confirmResetPassword(user: ManagedUser) {
  resetPasswordTargetUser.value = user
  resetPasswordDialog.value = true
}

async function handleResetPassword() {
  if (!resetPasswordTargetUser.value) return
  resettingPassword.value = true
  try {
    const result = await userService.resetPassword(resetPasswordTargetUser.value.id)
    resetPasswordDialog.value = false
    resetPasswordTargetUser.value = null
    otpValue.value = result.temporaryPassword
    otpDialog.value = true
    await fetchUsers()
  } catch {
    // Error toast handled by API interceptor
  } finally {
    resettingPassword.value = false
  }
}

function copyOtp() {
  navigator.clipboard.writeText(otpValue.value)
  notificationStore.showSuccess(t('admin.passwordCopied'))
}

function roleBadgeColor(role: string) {
  switch (role) {
    case 'admin': return 'error'
    case 'super_user': return 'warning'
    default: return 'info'
  }
}

function roleLabel(role: string) {
  switch (role) {
    case 'admin': return t('admin.roleAdmin')
    case 'super_user': return t('admin.roleSuperUser')
    default: return t('admin.roleUser')
  }
}
</script>

<template>
  <div>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">{{ t('admin.userManagement') }}</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-account-plus" @click="openInvite">
        {{ t('admin.inviteUser') }}
      </v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <v-table v-if="users.length > 0">
      <thead>
        <tr>
          <th />
          <th>{{ t('auth.firstName') }}</th>
          <th>{{ t('auth.lastName') }}</th>
          <th>{{ t('auth.email') }}</th>
          <th>{{ t('admin.role') }}</th>
          <th>{{ t('admin.assignedLocations') }}</th>
          <th>{{ t('admin.temporaryPassword') }}</th>
          <th class="text-center">{{ t('admin.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td style="width: 48px">
            <v-avatar size="32" :color="user.color || '#1976D2'">
              <span class="text-white text-caption font-weight-bold">
                {{ (user.firstName?.[0] || '').toUpperCase() }}{{ (user.lastName?.[0] || '').toUpperCase() }}
              </span>
            </v-avatar>
          </td>
          <td>{{ user.firstName }}</td>
          <td>{{ user.lastName }}</td>
          <td>{{ user.email }}</td>
          <td>
            <v-chip size="small" :color="roleBadgeColor(user.role)">
              {{ roleLabel(user.role) }}
            </v-chip>
          </td>
          <td>
            <v-chip
              size="small"
              variant="outlined"
              class="me-1"
              @click="openLocations(user)"
            >
              {{ user.locations.length }} {{ t('nav.locations') }}
            </v-chip>
          </td>
          <td>
            <code v-if="user.temporaryPassword" class="text-body-2">{{ user.temporaryPassword }}</code>
            <span v-else class="text-grey text-caption">—</span>
          </td>
          <td class="text-center">
            <v-btn
              icon
              size="small"
              variant="text"
              :disabled="!authStore.isAdmin && user.role === 'admin'"
              @click="openEdit(user)"
            >
              <v-icon>mdi-pencil</v-icon>
              <v-tooltip activator="parent" location="top">{{ t('admin.edit') }}</v-tooltip>
            </v-btn>
            <v-btn
              icon
              size="small"
              variant="text"
              :disabled="!authStore.isAdmin && user.role === 'admin'"
              @click="openLocations(user)"
            >
              <v-icon>mdi-map-marker</v-icon>
              <v-tooltip activator="parent" location="top">{{ t('admin.assignedLocations') }}</v-tooltip>
            </v-btn>
            <v-btn
              icon
              size="small"
              variant="text"
              :disabled="user.id === authStore.user?.id || (!authStore.isAdmin && user.role === 'admin')"
              @click="confirmResetPassword(user)"
            >
              <v-icon>mdi-lock-reset</v-icon>
              <v-tooltip activator="parent" location="top">{{ t('admin.resetPassword') }}</v-tooltip>
            </v-btn>
            <v-btn
              icon
              size="small"
              variant="text"
              color="error"
              :disabled="user.id === authStore.user?.id || (!authStore.isAdmin && user.role === 'admin')"
              @click="confirmDelete(user)"
            >
              <v-icon>mdi-delete</v-icon>
              <v-tooltip activator="parent" location="top">{{ t('admin.delete') }}</v-tooltip>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-alert v-else-if="!loading" type="info">{{ t('common.noData') }}</v-alert>

    <!-- Add User Dialog -->
    <v-dialog v-model="inviteDialog" max-width="500">
      <v-card>
        <v-card-title>{{ t('admin.inviteUser') }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="inviteData.email"
            :label="t('auth.email')"
            type="email"
            variant="outlined"
            autocomplete="off"
            :rules="emailRules"
            class="mb-2"
          />
          <v-text-field
            v-model="inviteData.firstName"
            :label="t('auth.firstName')"
            variant="outlined"
            autocomplete="off"
            :rules="[requiredRule(t('auth.firstNameRequired'))]"
            class="mb-2"
          />
          <v-text-field
            v-model="inviteData.lastName"
            :label="t('auth.lastName')"
            variant="outlined"
            autocomplete="off"
            :rules="[requiredRule(t('auth.lastNameRequired'))]"
            class="mb-2"
          />
          <v-select
            v-model="inviteData.role"
            :items="roleOptions"
            item-title="title"
            item-value="value"
            :label="t('admin.role')"
            variant="outlined"
            class="mb-2"
          />
          <v-select
            v-model="inviteLocationIds"
            :items="allLocations"
            item-title="name"
            item-value="id"
            :label="t('admin.assignedLocations')"
            variant="outlined"
            multiple
            chips
            closable-chips
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="inviteDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn
            color="primary"
            :loading="inviteSaving"
            :disabled="!inviteData.email || !inviteData.firstName || !inviteData.lastName"
            @click="handleInvite"
          >
            {{ t('admin.inviteUser') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit User Dialog -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card>
        <v-card-title>{{ t('admin.edit') }} — {{ editingUser?.email }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editFirstName"
            :label="t('auth.firstName')"
            variant="outlined"
            class="mb-2"
          />
          <v-text-field
            v-model="editLastName"
            :label="t('auth.lastName')"
            variant="outlined"
            class="mb-2"
          />
          <v-select
            v-model="editRole"
            :items="roleOptions"
            item-title="title"
            item-value="value"
            :label="t('admin.role')"
            variant="outlined"
            class="mb-2"
          />
          <v-text-field
            v-model="editPassword"
            :label="t('admin.setPassword')"
            type="password"
            variant="outlined"
            :rules="[v => !v || v.length >= 8 || t('auth.passwordMinLength')]"
            :hint="t('auth.passwordMinLength')"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="editDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="primary" :loading="editSaving" @click="handleEdit">
            {{ t('admin.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Assign Locations Dialog -->
    <v-dialog v-model="locationsDialog" max-width="500">
      <v-card>
        <v-card-title>{{ t('admin.assignedLocations') }}</v-card-title>
        <v-card-text>
          <v-checkbox
            v-for="loc in allLocations"
            :key="loc.id"
            v-model="selectedLocationIds"
            :label="loc.name"
            :value="loc.id"
            hide-details
            density="compact"
          />
          <p v-if="allLocations.length === 0" class="text-grey">{{ t('common.noData') }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="locationsDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="primary" :loading="locationsSaving" @click="handleAssignLocations">
            {{ t('admin.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reset Password Confirmation Dialog -->
    <v-dialog v-model="resetPasswordDialog" max-width="400">
      <v-card>
        <v-card-title>{{ t('admin.resetPassword') }}</v-card-title>
        <v-card-text>
          {{ t('admin.resetPasswordConfirm') }} <strong>{{ resetPasswordTargetUser?.firstName }} {{ resetPasswordTargetUser?.lastName }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="resetPasswordDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="warning" :loading="resettingPassword" @click="handleResetPassword">{{ t('admin.resetPassword') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>{{ t('admin.delete') }}</v-card-title>
        <v-card-text>
          {{ t('admin.confirmDelete') }} <strong>{{ deleteTargetUser?.firstName }} {{ deleteTargetUser?.lastName }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="error" :loading="deleting" @click="handleDelete">{{ t('admin.delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Temporary Password (OTP) Dialog -->
    <v-dialog v-model="otpDialog" max-width="450">
      <v-card>
        <v-card-title>{{ t('admin.temporaryPassword') }}</v-card-title>
        <v-card-text>
          <p class="mb-4 text-body-2">{{ t('admin.temporaryPasswordHint') }}</p>
          <v-text-field
            :model-value="otpValue"
            readonly
            variant="outlined"
            density="compact"
            append-inner-icon="mdi-content-copy"
            @click:append-inner="copyOtp"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="otpDialog = false">{{ t('common.confirm') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
