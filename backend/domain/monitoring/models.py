from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, Integer, String, Float

from core.database import Base


class TokenUsageLog(Base):
    __tablename__ = "token_usage_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    model_used = Column(String(100), nullable=False)
    tokens_used = Column(Integer, nullable=False, default=0)
    execution_time_ms = Column(Float, nullable=False, default=0.0)
    context = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
