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
import { 
  ExecutiveDashboardPage, GrowthAnalyticsPage, SalesAnalyticsPage, 
  FinanceAnalyticsPage, DeliveryAnalyticsPage 
} from '@/features/analytics'
import { UsersPage } from '@/features/users/UsersPage'
import { AppLayout } from '@/components/layout/AppLayout'

// ── Auth Guard ────────────────────────────────────────────────
function requireAuth() {
  const state = authStore.state
  if (!state.isAuthenticated) {
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
  component: ExecutiveDashboardPage,
})

const growthAnalyticsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/analytics/growth',
  component: GrowthAnalyticsPage,
})

const salesAnalyticsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/analytics/sales',
  component: SalesAnalyticsPage,
})

const financeAnalyticsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/analytics/finance',
  component: FinanceAnalyticsPage,
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
import { HotLeadsPage } from '@/features/portal/HotLeadsPage'
import { MyLeadsPage } from '@/features/portal/MyLeadsPage'
import { OperationsPage } from '@/features/operations/OperationsPage'

const operationsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/operations',
  component: OperationsPage,
})

const leadsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/leads',
  component: LeadsListPage,
})

const hotLeadsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/leads/hot',
  component: HotLeadsPage,
})

const myLeadsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/leads/my',
  component: MyLeadsPage,
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

// ── Discovery Routes ──────────────────────────────────────────
import { DiscoveryRunsPage } from '@/features/discovery/pages/DiscoveryRunsPage'
import { DiscoveryRunDetailPage } from '@/features/discovery/pages/DiscoveryRunDetailPage'
import { RawBusinessesPage } from '@/features/discovery/pages/RawBusinessesPage'
import { BulkDiscoveryPage } from '@/features/discovery/pages/BulkDiscoveryPage'
import { DiscoveryMetricsPage } from '@/features/discovery/pages/DiscoveryMetricsPage'

const discoveryRunsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/discovery/runs',
  component: DiscoveryRunsPage,
})

const discoveryRunDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/discovery/runs/$id',
  component: DiscoveryRunDetailPage,
})

const discoveryBusinessesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/discovery/businesses',
  component: RawBusinessesPage,
})

const discoveryBulkRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/discovery/bulk',
  component: BulkDiscoveryPage,
})

const discoveryMetricsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/discovery/metrics',
  component: DiscoveryMetricsPage,
})

// ── Analysis Routes ───────────────────────────────────────────
import { AnalysisListPage } from '@/features/analysis/pages/AnalysisListPage'
import { AnalysisDetailPage } from '@/features/analysis/pages/AnalysisDetailPage'

const analysisListRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/analysis',
  component: AnalysisListPage,
})

const analysisDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/analysis/$leadId',
  component: AnalysisDetailPage,
})

// ── Qualification Routes ──────────────────────────────────────
import { QualificationListPage } from '@/features/qualification/pages/QualificationListPage'
import { QualificationDetailPage } from '@/features/qualification/pages/QualificationDetailPage'

const qualificationListRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/qualifications',
  component: QualificationListPage,
})

const qualificationDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/qualifications/$leadId',
  component: QualificationDetailPage,
})

// ── Outreach Routes ───────────────────────────────────────────
import { OutreachListPage } from '@/features/outreach/pages/OutreachListPage'
import { OutreachDetailPage } from '@/features/outreach/pages/OutreachDetailPage'

const outreachListRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/outreach',
  component: OutreachListPage,
})

const outreachDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/outreach/$draftId',
  component: OutreachDetailPage,
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

// ── System Routes ─────────────────────────────────────────────
import { SystemMonitorPage, AuditLogPage, NotificationsPage, BackupPage } from '@/features/system'

const systemMonitorRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/system/monitor',
  component: SystemMonitorPage,
})

const auditLogRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/system/audit',
  component: AuditLogPage,
})

const notificationsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/system/notifications',
  component: NotificationsPage,
})

const backupsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/system/backups',
  component: BackupPage,
})

// ── Profile Route ─────────────────────────────────────────────
import { MyProfilePage } from '@/features/profile/pages/MyProfilePage'

const myProfileRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/profile',
  component: MyProfilePage,
})

// ── Router Tree ───────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([
    indexRoute,
    dashboardRoute,
    operationsRoute,
    growthAnalyticsRoute,
    salesAnalyticsRoute,
    financeAnalyticsRoute,
    usersRoute,
    leadsRoute,
    hotLeadsRoute,
    myLeadsRoute,
    leadDetailRoute,
    leadAnalysisRoute,
    discoveryRunsRoute,
    discoveryRunDetailRoute,
    discoveryBusinessesRoute,
    discoveryBulkRoute,
    discoveryMetricsRoute,
    analysisListRoute,
    analysisDetailRoute,
    qualificationListRoute,
    qualificationDetailRoute,
    outreachListRoute,
    outreachDetailRoute,
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
    systemMonitorRoute,
    auditLogRoute,
    notificationsRoute,
    backupsRoute,
    myProfileRoute,
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
