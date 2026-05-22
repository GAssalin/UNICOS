import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '@/modules/auth/composables/useAuth'
import { hasPermission } from '@/modules/auth/composables/usePermissions'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/pages/LoginPage.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/',
    component: () => import('@/shared/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/modules/dashboard/pages/DashboardHomePage.vue'),
        meta: { title: 'Dashboard' }
      },
      {
        path: 'estoque',
        name: 'estoque',
        component: () => import('@/modules/estoque/pages/StockPage.vue'),
        meta: { title: 'Estoque', permission: 'ESTOQUE_LISTAR' }
      },
      {
        path: 'produtos',
        name: 'produtos',
        component: () => import('@/modules/produtos/pages/ProductsPage.vue'),
        meta: { title: 'Produtos', permission: 'PRODUTO_LISTAR' }
      }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const authenticated = isAuthenticated()

  if (to.meta.requiresAuth && !authenticated) return { name: 'login' }
  if (to.meta.guestOnly && authenticated) return { name: 'dashboard' }

  if (authenticated && to.meta.permission && !hasPermission(to.meta.permission)) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
