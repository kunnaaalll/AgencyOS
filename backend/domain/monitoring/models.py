from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from core.database import Base


class TokenUsageLog(Base):
    __tablename__ = "token_usage_logs"
    model_used = Column(String(100), nullable=False)
    tokens_used = Column(Integer, nullable=False, default=0)
    execution_time_ms = Column(Float, nullable=False, default=0.0)
    context = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
