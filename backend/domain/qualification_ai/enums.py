from enum import Enum


class Priority(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class QualificationStatus(str, Enum):
    QUALIFIED = "QUALIFIED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    NOT_QUALIFIED = "NOT_QUALIFIED"
