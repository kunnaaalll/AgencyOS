from enum import Enum


class ClientStatus(str, Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    CHURNED = "CHURNED"
    COMPLETED = "COMPLETED"

class HealthStatus(str, Enum):
    HEALTHY = "HEALTHY"
    AT_RISK = "AT_RISK"
    RENEWAL_DUE = "RENEWAL_DUE"
    UPSELL_OPPORTUNITY = "UPSELL_OPPORTUNITY"
