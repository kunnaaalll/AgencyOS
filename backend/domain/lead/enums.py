from enum import Enum


class LeadStatus(str, Enum):
    NEW = "NEW"
    ANALYZED = "ANALYZED"
    QUALIFIED = "QUALIFIED"
    CONTACTED = "CONTACTED"
    MEETING = "MEETING"
    PROPOSAL = "PROPOSAL"
    WON = "WON"
    LOST = "LOST"


class Priority(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
