from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.analytics.schemas import (
    DeliveryMetricsResponse,
    DistributionData,
    ExecutiveSummaryResponse,
    FinancialTrendData,
    ForecastResponse,
    GrowthMetricsResponse,
    LeadFunnelData,
    RevenueMetricsResponse,
    SalesMetricsResponse,
    TrendData,
    WinLossData,
)
from domain.client.enums import ClientStatus, HealthStatus
from domain.client.models import Client
from domain.crm.enums import PipelineStage
from domain.crm.models import Meeting, Opportunity
from domain.finance.enums import RevenueStatus
from domain.finance.models import Revenue
from domain.finance.services import FinanceService
from domain.lead.enums import LeadStatus
from domain.lead.models import Lead
from domain.project.enums import ProjectStatus
from domain.project.models import Project
from domain.task.enums import TaskStatus
from domain.task.models import Task


class AnalyticsService:
    @staticmethod
    async def get_growth_metrics(db: AsyncSession) -> GrowthMetricsResponse:
        # Total Leads
        total_leads_query = await db.execute(select(func.count(Lead.id)))
        total_leads = total_leads_query.scalar() or 0

        # Qualified Leads
        qualified_leads_query = await db.execute(
            select(func.count(Lead.id)).where(
                Lead.status.in_(
                    [
                        LeadStatus.QUALIFIED,
                        LeadStatus.CONTACTED,
                        LeadStatus.MEETING,
                        LeadStatus.PROPOSAL,
                        LeadStatus.WON,
                    ]
                )
            )
        )
        qualified_leads = qualified_leads_query.scalar() or 0

        lead_qualification_rate = (qualified_leads / total_leads * 100) if total_leads > 0 else 0.0

        # Meetings
        meetings_query = await db.execute(select(func.count(Meeting.id)))
        meetings_scheduled = meetings_query.scalar() or 0

        # Proposals
        proposals_query = await db.execute(
            select(func.count(Opportunity.id)).where(
                Opportunity.pipeline_stage == PipelineStage.PROPOSAL
            )
        )
        proposal_count = proposals_query.scalar() or 0

        # Win Rate
        won_query = await db.execute(
            select(func.count(Opportunity.id)).where(
                Opportunity.pipeline_stage == PipelineStage.WON
            )
        )
        lost_query = await db.execute(
            select(func.count(Opportunity.id)).where(
                Opportunity.pipeline_stage == PipelineStage.LOST
            )
        )
        won = won_query.scalar() or 0
        lost = lost_query.scalar() or 0
        total_closed = won + lost
        win_rate = (won / total_closed * 100) if total_closed > 0 else 0.0

        # Clients
        today = date.today()
        start_of_month = today.replace(day=1)
        new_clients_query = await db.execute(
            select(func.count(Client.id)).where(Client.contract_start_date >= start_of_month)
        )
        new_clients_this_month = new_clients_query.scalar() or 0

        active_clients_query = await db.execute(
            select(func.count(Client.id)).where(Client.status == ClientStatus.ACTIVE)
        )
        active_clients = active_clients_query.scalar() or 0

        churned_clients_query = await db.execute(
            select(func.count(Client.id)).where(Client.status == ClientStatus.CHURNED)
        )
        churned_clients = churned_clients_query.scalar() or 0

        total_clients_query = await db.execute(select(func.count(Client.id)))
        total_clients = total_clients_query.scalar() or 0

        churn_rate = (churned_clients / total_clients * 100) if total_clients > 0 else 0.0

        # Lead Funnel (Group By Status)
        funnel_result = await db.execute(
            select(Lead.status, func.count(Lead.id)).group_by(Lead.status)
        )
        lead_funnel = [
            LeadFunnelData(
                stage=row[0].value if hasattr(row[0], "value") else str(row[0]), count=row[1] or 0
            )
            for row in funnel_result.all()
        ]

        # Calculate real trends for charts (last 6 months)
        lead_qualification_trend = []
        client_growth_trend = []
        for i in range(5, -1, -1):
            start_date = (today.replace(day=1) - timedelta(days=30 * i)).replace(day=1)
            if start_date.month == 12:
                end_date = start_date.replace(year=start_date.year + 1, month=1)
            else:
                end_date = start_date.replace(month=start_date.month + 1)

            m_str = start_date.strftime("%b %Y")

            # Count leads qualified in this month
            l_q = await db.execute(
                select(func.count(Lead.id)).where(
                    Lead.status == LeadStatus.QUALIFIED,
                    Lead.created_at >= start_date,
                    Lead.created_at < end_date,
                )
            )
            lead_qualification_trend.append(TrendData(date=m_str, value=l_q.scalar() or 0))

            # Count clients created in this month
            c_q = await db.execute(
                select(func.count(Client.id)).where(
                    Client.created_at >= start_date, Client.created_at < end_date
                )
            )
            client_growth_trend.append(TrendData(date=m_str, value=c_q.scalar() or 0))

        return GrowthMetricsResponse(
            total_leads=total_leads,
            qualified_leads=qualified_leads,
            lead_qualification_rate=lead_qualification_rate,
            meetings_scheduled=meetings_scheduled,
            proposal_count=proposal_count,
            win_rate=win_rate,
            new_clients_this_month=new_clients_this_month,
            churn_rate=churn_rate,
            active_clients=active_clients,
            lead_funnel=lead_funnel,
            lead_qualification_trend=lead_qualification_trend,
            client_growth_trend=client_growth_trend,
        )

    @staticmethod
    async def get_revenue_metrics(db: AsyncSession) -> RevenueMetricsResponse:
        today = date.today()
        # MRR
        mrr_result = await db.execute(
            select(func.sum(Revenue.amount))
            .where(Revenue.status == RevenueStatus.RECEIVED)
            .where(func.extract("month", Revenue.received_date) == today.month)
            .where(func.extract("year", Revenue.received_date) == today.year)
        )
        mrr = mrr_result.scalar() or 0.0

        arr = float(mrr) * 12.0

        # Total lifetime revenue
        total_rev_result = await db.execute(
            select(func.sum(Revenue.amount)).where(Revenue.status == RevenueStatus.RECEIVED)
        )
        lifetime_revenue = float(total_rev_result.scalar() or 0.0)

        # Clients for average revenue
        active_clients_query = await db.execute(
            select(func.count(Client.id)).where(Client.status == ClientStatus.ACTIVE)
        )
        active_clients = active_clients_query.scalar() or 0
        average_revenue_per_client = float(mrr) / active_clients if active_clients > 0 else 0.0

        # Simplified deterministic growth %
        revenue_growth_percentage = 5.0
        profit_growth_percentage = 4.5

        # Financial Trend
        financial_trend = []
        for i in range(5, -1, -1):
            m_date = today - timedelta(days=30 * i)
            m_str = m_date.strftime("%b %Y")
            scale = (6 - i) / 6.0
            financial_trend.append(
                FinancialTrendData(
                    date=m_str,
                    revenue=float(mrr) * scale * 1.2,
                    expense=float(mrr) * scale * 0.4,
                    profit=float(mrr) * scale * 0.8,
                    mrr=float(mrr) * scale,
                )
            )

        return RevenueMetricsResponse(
            mrr=float(mrr),
            arr=arr,
            revenue_growth_percentage=revenue_growth_percentage,
            profit_growth_percentage=profit_growth_percentage,
            average_revenue_per_client=average_revenue_per_client,
            lifetime_revenue=lifetime_revenue,
            financial_trend=financial_trend,
        )

    @staticmethod
    async def get_sales_metrics(db: AsyncSession) -> SalesMetricsResponse:
        # Pipeline value (All opportunities not closed)
        open_opps_result = await db.execute(
            select(func.sum(Opportunity.value)).where(
                Opportunity.pipeline_stage.notin_([PipelineStage.WON, PipelineStage.LOST])
            )
        )
        pipeline_value = open_opps_result.scalar() or 0.0

        # Weighted pipeline (e.g. sum(value * probability / 100))
        # SQLite doesn't directly support this easily without numeric casting issues, so let's fetch open opps
        open_opps = await db.execute(
            select(Opportunity.value, Opportunity.probability).where(
                Opportunity.pipeline_stage.notin_([PipelineStage.WON, PipelineStage.LOST])
            )
        )
        weighted_pipeline_value = sum(
            (float(val) * float(prob) / 100.0) for val, prob in open_opps.all() if val and prob
        )

        # Average deal size (WON opps)
        won_deals_res = await db.execute(
            select(func.sum(Opportunity.value)).where(
                Opportunity.pipeline_stage == PipelineStage.WON
            )
        )
        won_deals_val = won_deals_res.scalar() or 0.0

        won_count_res = await db.execute(
            select(func.count(Opportunity.id)).where(
                Opportunity.pipeline_stage == PipelineStage.WON
            )
        )
        won_count = won_count_res.scalar() or 0
        average_deal_size = float(won_deals_val) / won_count if won_count > 0 else 0.0

        sales_conversion_rate = 25.0
        average_sales_cycle_days = 30.0

        # Distributions
        stage_dist_res = await db.execute(
            select(Opportunity.pipeline_stage, func.count(Opportunity.id)).group_by(
                Opportunity.pipeline_stage
            )
        )
        pipeline_stage_distribution = [
            DistributionData(
                name=row[0].value if hasattr(row[0], "value") else str(row[0]), value=row[1] or 0
            )
            for row in stage_dist_res.all()
        ]

        won_query = await db.execute(
            select(func.count(Opportunity.id)).where(
                Opportunity.pipeline_stage == PipelineStage.WON
            )
        )
        lost_query = await db.execute(
            select(func.count(Opportunity.id)).where(
                Opportunity.pipeline_stage == PipelineStage.LOST
            )
        )
        win_loss_ratio = [
            WinLossData(name="Won", value=won_query.scalar() or 0),
            WinLossData(name="Lost", value=lost_query.scalar() or 0),
        ]

        deal_size_distribution = [
            DistributionData(name="Small", value=10),
            DistributionData(name="Medium", value=5),
            DistributionData(name="Large", value=2),
        ]

        return SalesMetricsResponse(
            pipeline_value=float(pipeline_value),
            weighted_pipeline_value=float(weighted_pipeline_value),
            average_deal_size=average_deal_size,
            sales_conversion_rate=sales_conversion_rate,
            average_sales_cycle_days=average_sales_cycle_days,
            pipeline_stage_distribution=pipeline_stage_distribution,
            win_loss_ratio=win_loss_ratio,
            deal_size_distribution=deal_size_distribution,
        )

    @staticmethod
    async def get_delivery_metrics(db: AsyncSession) -> DeliveryMetricsResponse:
        # Tasks
        open_tasks_res = await db.execute(
            select(func.count(Task.id)).where(Task.status.notin_([TaskStatus.DONE]))
        )
        open_tasks = open_tasks_res.scalar() or 0

        completed_tasks_res = await db.execute(
            select(func.count(Task.id)).where(Task.status == TaskStatus.DONE)
        )
        completed_tasks = completed_tasks_res.scalar() or 0

        # Projects
        active_projects_res = await db.execute(
            select(func.count(Project.id)).where(Project.status == ProjectStatus.ACTIVE)
        )
        completed_projects_res = await db.execute(
            select(func.count(Project.id)).where(Project.status == ProjectStatus.COMPLETED)
        )
        total_projects_res = await db.execute(select(func.count(Project.id)))

        active_projects = active_projects_res.scalar() or 0
        completed_projects = completed_projects_res.scalar() or 0
        total_projects = total_projects_res.scalar() or 0

        project_completion_rate = (
            (completed_projects / total_projects * 100) if total_projects > 0 else 0.0
        )

        # Clients Renewals
        renewals_due_res = await db.execute(
            select(func.count(Client.id)).where(Client.health_status == HealthStatus.RENEWAL_DUE)
        )
        renewals_due = renewals_due_res.scalar() or 0

        # Distributions
        task_dist_res = await db.execute(
            select(Task.status, func.count(Task.id)).group_by(Task.status)
        )
        task_status_distribution = [
            DistributionData(
                name=row[0].value if hasattr(row[0], "value") else str(row[0]), value=row[1] or 0
            )
            for row in task_dist_res.all()
        ]

        health_dist_res = await db.execute(
            select(Client.health_status, func.count(Client.id)).group_by(Client.health_status)
        )
        client_health_distribution = [
            DistributionData(
                name=row[0].value if hasattr(row[0], "value") else str(row[0]), value=row[1] or 0
            )
            for row in health_dist_res.all()
        ]

        proj_dist_res = await db.execute(
            select(Project.status, func.count(Project.id)).group_by(Project.status)
        )
        project_status_distribution = [
            DistributionData(
                name=row[0].value if hasattr(row[0], "value") else str(row[0]), value=row[1] or 0
            )
            for row in proj_dist_res.all()
        ]

        return DeliveryMetricsResponse(
            open_tasks=open_tasks,
            completed_tasks=completed_tasks,
            project_completion_rate=project_completion_rate,
            renewals_due=renewals_due,
            task_status_distribution=task_status_distribution,
            client_health_distribution=client_health_distribution,
            project_status_distribution=project_status_distribution,
        )

    @staticmethod
    async def get_forecast(db: AsyncSession) -> ForecastResponse:
        summary = await FinanceService.get_summary(db)

        projected_mrr = float(summary.mrr or 0.0) * 1.10
        projected_profit = float(summary.net_profit or 0.0) * 1.05

        active_clients_query = await db.execute(
            select(func.count(Client.id)).where(Client.status == ClientStatus.ACTIVE)
        )
        active_clients = active_clients_query.scalar() or 0

        projected_clients = int(active_clients * 1.15)

        # Real hiring logic based on actual task utilization
        total_tasks_q = await db.execute(select(func.count(Task.id)))
        total_tasks = total_tasks_q.scalar() or 0
        completed_tasks_q = await db.execute(
            select(func.count(Task.id)).where(Task.status == TaskStatus.DONE)
        )
        completed_tasks = completed_tasks_q.scalar() or 0

        task_utilization = (completed_tasks / total_tasks * 100.0) if total_tasks > 0 else 0.0

        hiring_recommendation = False
        hiring_reason = "Current capacity is sufficient."

        if active_clients >= 10 and task_utilization > 85.0:
            hiring_recommendation = True
            hiring_reason = (
                f"10+ active clients AND Task utilization > 85% (Current: {task_utilization:.1f}%)"
            )
        elif task_utilization > 95.0:
            hiring_recommendation = True
            hiring_reason = f"Task utilization critically high (Current: {task_utilization:.1f}%)"

        return ForecastResponse(
            projected_mrr=projected_mrr,
            projected_profit=projected_profit,
            projected_clients=projected_clients,
            hiring_recommendation=hiring_recommendation,
            hiring_reason=hiring_reason,
        )

    @staticmethod
    async def get_executive_summary(db: AsyncSession) -> ExecutiveSummaryResponse:
        growth = await AnalyticsService.get_growth_metrics(db)
        revenue = await AnalyticsService.get_revenue_metrics(db)
        sales = await AnalyticsService.get_sales_metrics(db)
        delivery = await AnalyticsService.get_delivery_metrics(db)
        forecast = await AnalyticsService.get_forecast(db)

        return ExecutiveSummaryResponse(
            growth=growth, sales=sales, finance=revenue, delivery=delivery, forecast=forecast
        )
