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

// ── Leads Routes ──────────────────────────────────────────────
import { LeadsListPage } from '@/features/leads/pages/LeadsListPage'
import { LeadDetailPage } from '@/features/leads/pages/LeadDetailPage'
import { LeadAnalysisPage } from '@/features/leads/pages/LeadAnalysisPage'

const leadsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/leads',
  component: LeadsListPage,
})

const leadDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/leads/$id',
  component: LeadDetailPage,
})

const leadAnalysisRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/leads/$id/analysis',
  component: LeadAnalysisPage,
})

// ── CRM Routes ────────────────────────────────────────────────
import { CRMBoardPage, OpportunityDetailPage, MeetingsPage } from '@/features/crm'

const crmBoardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/crm',
  component: CRMBoardPage,
})

const opportunityDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/crm/opportunities/$id',
  component: OpportunityDetailPage,
})

const meetingsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/crm/meetings',
  component: MeetingsPage,
})

// ── Client OS Routes ──────────────────────────────────────────
import { ClientsListPage, ClientDetailPage, ProjectBoardPage } from '@/features/clients'

const clientsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/clients',
  component: ClientsListPage,
})

const clientDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/clients/$id',
  component: ClientDetailPage,
})

const projectBoardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/projects/$id/board',
  component: ProjectBoardPage,
})

// ── Finance OS Routes ─────────────────────────────────────────
import { 
  FinanceDashboardPage, RevenuePage, ExpensesPage, FounderPage 
} from '@/features/finance'

const financeDashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/finance',
  component: FinanceDashboardPage,
})

const financeRevenueRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/finance/revenue',
  component: RevenuePage,
})

const financeExpensesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/finance/expenses',
  component: ExpensesPage,
})

const financeFoundersRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/finance/founders',
  component: FounderPage,
})

// ── Knowledge OS Routes ───────────────────────────────────────
import { KnowledgePage, KnowledgeEditorPage } from '@/features/knowledge'

const knowledgeRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/knowledge',
  component: KnowledgePage,
})

const knowledgeNewRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/knowledge/new',
  component: KnowledgeEditorPage,
})

const knowledgeEditRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/knowledge/$id/edit',
  component: KnowledgeEditorPage,
})

// ── Document Vault Routes ─────────────────────────────────────
import { DocumentVaultPage, CredentialPage } from '@/features/documents'

const documentsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/documents',
  component: DocumentVaultPage,
})

const credentialsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/credentials',
  component: CredentialPage,
})

// ── Router Tree ───────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([
    indexRoute,
    dashboardRoute,
    usersRoute,
    leadsRoute,
    leadDetailRoute,
    leadAnalysisRoute,
    crmBoardRoute,
    opportunityDetailRoute,
    meetingsRoute,
    clientsRoute,
    clientDetailRoute,
    projectBoardRoute,
    financeDashboardRoute,
    financeRevenueRoute,
    financeExpensesRoute,
    financeFoundersRoute,
    knowledgeRoute,
    knowledgeNewRoute,
    knowledgeEditRoute,
    documentsRoute,
    credentialsRoute,
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
