import structlog
from events.bus import event_bus
from domain.crm.events import OpportunityWonEvent
from domain.client.schemas import ClientCreate
from domain.project.schemas import ProjectCreate
from domain.client.enums import ClientStatus, HealthStatus
from domain.project.enums import ProjectStatus
from domain.client.services import ClientService
from domain.project.services import ProjectService
from domain.crm.services import CRMService
from core.database import async_session_maker

logger = structlog.get_logger(__name__)

@event_bus.subscribe("crm.opportunity.won")
async def handle_opportunity_won(event: OpportunityWonEvent) -> None:
    """
    When an opportunity is won, automatically create a Client and a Default Project.
    """
    logger.info("Handling OpportunityWonEvent", opportunity_id=event.opportunity_id)
    
    async with async_session_maker() as db:
        try:
            # 1. Fetch Opportunity data to populate Client
            import uuid
            opp_id = uuid.UUID(event.opportunity_id)
            opp = await CRMService.get_opportunity(db, opp_id)
            
            # Default package based on the value or some internal logic.
            # Using "Standard Package" as a generic default for now.
            
            client_data = ClientCreate(
                opportunity_id=opp_id,
                business_name=opp.title.split("-")[0].strip() if "-" in opp.title else opp.title,
                package_type="Standard Package",
                monthly_retainer=opp.value,
                status=ClientStatus.ACTIVE,
                health_status=HealthStatus.HEALTHY,
                renewal_probability=80,
                notes=opp.notes
            )
            
            # 2. Create Client
            client = await ClientService.create_client(db, client_data)
            logger.info("Created Client from Won Opportunity", client_id=str(client.id))
            
            # 3. Create Default Project
            project_data = ProjectCreate(
                name=f"Onboarding: {client.business_name}",
                description="Default onboarding project created from CRM conversion.",
                status=ProjectStatus.PLANNING
            )
            
            project = await ProjectService.create_project(db, client.id, project_data)
            logger.info("Created Default Project for Client", project_id=str(project.id))
            
            await db.commit()
            
        except Exception as e:
            logger.error("Failed to convert Opportunity to Client", error=str(e))
            await db.rollback()

def register_listeners():
    """Import to ensure listeners are registered."""
    pass
