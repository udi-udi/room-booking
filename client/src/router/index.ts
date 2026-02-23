import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminCompanyStore } from '@/stores/adminCompany'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/components/auth/LoginPage.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/components/auth/RegisterPage.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      redirect: '/calendar',
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/components/calendar/WeeklyCalendar.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/company',
      name: 'admin-company',
      component: () => import('@/components/admin/CompanySettings.vue'),
      meta: { requiresAuth: true, roles: ['super_user', 'admin'] },
    },
    {
      path: '/admin/locations',
      name: 'admin-locations',
      component: () => import('@/components/admin/LocationManagement.vue'),
      meta: { requiresAuth: true, roles: ['super_user', 'admin'] },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('@/components/admin/UserManagement.vue'),
      meta: { requiresAuth: true, roles: ['super_user', 'admin'] },
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('@/components/admin/AdminDashboard.vue'),
      meta: { requiresAuth: true, roles: ['admin'] },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

let authInitialized = false

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authInitialized) {
    await authStore.initialize()
    authInitialized = true
  }

  // Ensure admin companies are loaded (may not have been ready at first init before login)
  if (authStore.isAdmin) {
    const adminCompanyStore = useAdminCompanyStore()
    if (!adminCompanyStore.initialized) {
      await adminCompanyStore.fetchCompanies()
    }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guest && authStore.isAuthenticated) {
    return { name: 'calendar' }
  }

  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles && !requiredRoles.includes(authStore.user?.role ?? '')) {
    return { name: 'calendar' }
  }
})

export default router
