from pydantic import BaseModel


class OutreachDraftGeneratedEvent(BaseModel):
    type: str = "OutreachDraftGenerated"
    lead_id: str
    draft_id: str
    channel: str

class OutreachDraftApprovedEvent(BaseModel):
    type: str = "OutreachDraftApproved"
    lead_id: str
    draft_id: str
    channel: str
