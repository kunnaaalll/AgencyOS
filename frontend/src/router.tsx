// AgencyOS V2 — TanStack Router Configuration

import {
  createRouter,
  createRoute,
  createRootRoute,
  createMemoryHistory,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { authStore } from '@/store/authStore'

// ── Page imports ──────────────────────────────────────────────
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { UsersPage } from '@/features/users/UsersPage'
import { AppLayout } from '@/components/layout/AppLayout'

// ── Auth Guard ────────────────────────────────────────────────
function requireAuth() {
  const isAuthenticated = authStore.state.isAuthenticated
  if (!isAuthenticated) {
    throw redirect({ to: '/login' })
  }
}

// ── Root Route ────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: Outlet,
})

// ── Public Routes ─────────────────────────────────────────────
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: () => {
    if (authStore.state.isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
})

// ── Protected Layout Route ────────────────────────────────────
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: AppLayout,
  beforeLoad: requireAuth,
})

// ── Protected Child Routes ────────────────────────────────────
const indexRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})

const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/dashboard',
  component: DashboardPage,
})

const usersRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/users',
  component: UsersPage,
})

// ── Router Tree ───────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([
    indexRoute,
    dashboardRoute,
    usersRoute,
  ]),
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

// ── TypeScript Registration ───────────────────────────────────
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
