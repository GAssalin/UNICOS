import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '@/modules/auth/composables/useAuth'

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
      { path: '', name: 'dashboard', component: () => import('@/modules/dashboard/pages/DashboardHomePage.vue'), meta: { title: 'Dashboard' } },
      { path: 'compras', name: 'compras', component: () => import('@/shared/pages/ModulePage.vue'), props: { title: 'Compras' }, meta: { title: 'Compras' } },
      { path: 'estoque', name: 'estoque', component: () => import('@/modules/estoque/pages/StockPage.vue'), meta: { title: 'Estoque' } },
      { path: 'logistica', name: 'logistica', component: () => import('@/shared/pages/ModulePage.vue'), props: { title: 'Logística' }, meta: { title: 'Logística' } },
      { path: 'movimentacoes', name: 'movimentacoes', component: () => import('@/modules/movimentacoes/pages/MovementsPage.vue'), meta: { title: 'Movimentações' } },
      { path: 'produtos', name: 'produtos', component: () => import('@/modules/produtos/pages/ProductsPage.vue'), meta: { title: 'Produtos' } },
      { path: 'producao', name: 'producao', component: () => import('@/shared/pages/ModulePage.vue'), props: { title: 'Produção' }, meta: { title: 'Produção' } },
      { path: 'qualidade', name: 'qualidade', component: () => import('@/shared/pages/ModulePage.vue'), props: { title: 'Qualidade' }, meta: { title: 'Qualidade' } },
      { path: 'rh', name: 'rh', component: () => import('@/shared/pages/ModulePage.vue'), props: { title: 'RH' }, meta: { title: 'RH' } },
      { path: 'ti', name: 'ti', component: () => import('@/shared/pages/ModulePage.vue'), props: { title: 'TI' }, meta: { title: 'TI' } },
      { path: 'vendas', name: 'vendas', component: () => import('@/shared/pages/ModulePage.vue'), props: { title: 'Vendas' }, meta: { title: 'Vendas' } }
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
  return true
})

export default router
