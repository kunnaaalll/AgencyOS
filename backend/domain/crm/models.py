import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from domain.crm.enums import PipelineStage, ActivityType, MeetingType

class Opportunity(Base):
    __tablename__ = "opportunities"

    lead_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    pipeline_stage: Mapped[PipelineStage] = mapped_column(
        SQLEnum(PipelineStage, name="pipelinestage_enum"), default=PipelineStage.NEW, nullable=False
    )
    value: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    probability: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    expected_close_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Relationships
    lead: Mapped["Lead"] = relationship("Lead") # type: ignore
    owner: Mapped["User"] = relationship("User") # type: ignore
    activities: Mapped[list["Activity"]] = relationship("Activity", back_populates="opportunity", cascade="all, delete-orphan")
    meetings: Mapped[list["Meeting"]] = relationship("Meeting", back_populates="opportunity", cascade="all, delete-orphan")


class Activity(Base):
    __tablename__ = "activities"

    opportunity_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    activity_type: Mapped[ActivityType] = mapped_column(SQLEnum(ActivityType, name="activitytype_enum"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    scheduled_for: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    opportunity: Mapped["Opportunity"] = relationship("Opportunity", back_populates="activities")
    user: Mapped["User"] = relationship("User") # type: ignore


class Meeting(Base):
    __tablename__ = "meetings"

    opportunity_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    meeting_type: Mapped[MeetingType] = mapped_column(SQLEnum(MeetingType, name="meetingtype_enum"), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    meeting_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    outcome: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    opportunity: Mapped["Opportunity"] = relationship("Opportunity", back_populates="meetings")
