from enum import Enum

class PipelineStage(str, Enum):
    NEW = "NEW"
    QUALIFIED = "QUALIFIED"
    CONTACTED = "CONTACTED"
    MEETING = "MEETING"
    PROPOSAL = "PROPOSAL"
    WON = "WON"
    LOST = "LOST"

class ActivityType(str, Enum):
    CALL = "CALL"
    EMAIL = "EMAIL"
    WHATSAPP = "WHATSAPP"
    LINKEDIN = "LINKEDIN"
    NOTE = "NOTE"
    FOLLOW_UP = "FOLLOW_UP"
    MEETING = "MEETING"

class MeetingType(str, Enum):
    DISCOVERY = "DISCOVERY"
    STRATEGY = "STRATEGY"
    FOLLOW_UP = "FOLLOW_UP"
    CLOSING = "CLOSING"
