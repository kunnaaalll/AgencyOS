import uuid
from typing import Sequence
from datetime import date
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from domain.finance.models import Revenue, Expense, Founder, Distribution, FinanceSettings
from domain.finance.schemas import (
    RevenueCreate, RevenueUpdate, ExpenseCreate, ExpenseUpdate,
    FounderCreate, FounderUpdate, FinanceSummaryResponse, ForecastResponse
)
from domain.finance.enums import RevenueStatus, ExpenseStatus


class FinanceService:
    @staticmethod
    async def get_settings(db: AsyncSession) -> FinanceSettings:
        result = await db.execute(select(FinanceSettings).limit(1))
        settings = result.scalar_one_or_none()
        if not settings:
            settings = FinanceSettings(reserve_percentage=20.0)
            db.add(settings)
            await db.commit()
            await db.refresh(settings)
        return settings

    @staticmethod
    async def get_revenues(db: AsyncSession) -> Sequence[Revenue]:
        result = await db.execute(select(Revenue).order_by(Revenue.created_at.desc()))
        return result.scalars().all()

    @staticmethod
    async def create_revenue(db: AsyncSession, data: RevenueCreate) -> Revenue:
        revenue = Revenue(**data.model_dump())
        db.add(revenue)
        await db.commit()
        await db.refresh(revenue)
        return revenue

    @staticmethod
    async def update_revenue(db: AsyncSession, revenue_id: uuid.UUID, data: RevenueUpdate) -> Revenue:
        revenue = await db.get(Revenue, revenue_id)
        if not revenue:
            raise HTTPException(status_code=404, detail="Revenue not found")
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(revenue, key, value)
        await db.commit()
        await db.refresh(revenue)
        return revenue

    @staticmethod
    async def delete_revenue(db: AsyncSession, revenue_id: uuid.UUID) -> None:
        revenue = await db.get(Revenue, revenue_id)
        if not revenue:
            raise HTTPException(status_code=404, detail="Revenue not found")
        await db.delete(revenue)
        await db.commit()

    @staticmethod
    async def get_expenses(db: AsyncSession) -> Sequence[Expense]:
        result = await db.execute(select(Expense).order_by(Expense.created_at.desc()))
        return result.scalars().all()

    @staticmethod
    async def create_expense(db: AsyncSession, data: ExpenseCreate) -> Expense:
        expense = Expense(**data.model_dump())
        db.add(expense)
        await db.commit()
        await db.refresh(expense)
        return expense

    @staticmethod
    async def update_expense(db: AsyncSession, expense_id: uuid.UUID, data: ExpenseUpdate) -> Expense:
        expense = await db.get(Expense, expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(expense, key, value)
        await db.commit()
        await db.refresh(expense)
        return expense

    @staticmethod
    async def delete_expense(db: AsyncSession, expense_id: uuid.UUID) -> None:
        expense = await db.get(Expense, expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        await db.delete(expense)
        await db.commit()

    @staticmethod
    async def get_summary(db: AsyncSession) -> FinanceSummaryResponse:
        # Sum of RECEIVED revenues
        rev_result = await db.execute(select(func.sum(Revenue.amount)).where(Revenue.status == RevenueStatus.RECEIVED))
        total_revenue = rev_result.scalar() or 0.0

        # Sum of PAID expenses
        exp_result = await db.execute(select(func.sum(Expense.amount)).where(Expense.status == ExpenseStatus.PAID))
        total_expenses = exp_result.scalar() or 0.0

        # MRR calculation (Sum of all RECEIVED revenues in current month - simplified approach)
        today = date.today()
        mrr_result = await db.execute(
            select(func.sum(Revenue.amount))
            .where(Revenue.status == RevenueStatus.RECEIVED)
            .where(func.extract('month', Revenue.received_date) == today.month)
            .where(func.extract('year', Revenue.received_date) == today.year)
        )
        mrr = mrr_result.scalar() or 0.0

        net_profit = float(total_revenue) - float(total_expenses)
        
        settings = await FinanceService.get_settings(db)
        reserve_allocation = net_profit * (float(settings.reserve_percentage) / 100.0) if net_profit > 0 else 0.0
        distribution_pool = net_profit - reserve_allocation if net_profit > 0 else 0.0

        return FinanceSummaryResponse(
            mrr=float(mrr),
            total_revenue=float(total_revenue),
            total_expenses=float(total_expenses),
            net_profit=net_profit,
            reserve_fund=reserve_allocation,
            distribution_pool=distribution_pool
        )


class DistributionService:
    @staticmethod
    async def get_founders(db: AsyncSession) -> Sequence[Founder]:
        result = await db.execute(select(Founder).order_by(Founder.created_at.desc()))
        return result.scalars().all()

    @staticmethod
    async def validate_equity(db: AsyncSession, ignore_id: uuid.UUID | None = None, new_equity: float = 0.0) -> None:
        query = select(func.sum(Founder.equity_percentage)).where(Founder.is_active == True)
        if ignore_id:
            query = query.where(Founder.id != ignore_id)
        
        result = await db.execute(query)
        current_total = float(result.scalar() or 0.0)
        
        if round(current_total + float(new_equity), 2) > 100.0:
            raise HTTPException(status_code=400, detail="Total active equity cannot exceed 100%")

    @staticmethod
    async def create_founder(db: AsyncSession, data: FounderCreate) -> Founder:
        if data.is_active:
            await DistributionService.validate_equity(db, new_equity=data.equity_percentage)
            
        founder = Founder(**data.model_dump())
        db.add(founder)
        await db.commit()
        await db.refresh(founder)
        return founder

    @staticmethod
    async def update_founder(db: AsyncSession, founder_id: uuid.UUID, data: FounderUpdate) -> Founder:
        founder = await db.get(Founder, founder_id)
        if not founder:
            raise HTTPException(status_code=404, detail="Founder not found")
        
        update_data = data.model_dump(exclude_unset=True)
        
        is_active = update_data.get('is_active', founder.is_active)
        new_equity = update_data.get('equity_percentage', founder.equity_percentage)
        
        if is_active:
            await DistributionService.validate_equity(db, ignore_id=founder_id, new_equity=new_equity)
            
        for key, value in update_data.items():
            setattr(founder, key, value)
            
        await db.commit()
        await db.refresh(founder)
        return founder

    @staticmethod
    async def delete_founder(db: AsyncSession, founder_id: uuid.UUID) -> None:
        founder = await db.get(Founder, founder_id)
        if not founder:
            raise HTTPException(status_code=404, detail="Founder not found")
        await db.delete(founder)
        await db.commit()


class ForecastService:
    @staticmethod
    async def get_forecast(db: AsyncSession) -> ForecastResponse:
        summary = await FinanceService.get_summary(db)
        
        # Simple forecasting (e.g., projecting next month based on MRR trend)
        # Without historical trend data, we'll just apply a simple optimistic 10% growth rule for demo purposes
        projected_mrr = summary.mrr * 1.10
        projected_profit = summary.net_profit * 1.05
        
        # Hiring affordability (can we afford a $5k/mo resource?)
        # Let's say we need projected profit > $10k
        hiring_affordability = projected_profit / 2.0 if projected_profit > 0 else 0.0
        
        return ForecastResponse(
            projected_mrr=projected_mrr,
            projected_profit=projected_profit,
            hiring_affordability=hiring_affordability
        )
