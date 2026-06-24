import os
import re

files_to_fix = [
    "backend/domain/qualification_ai/models.py",
    "backend/domain/outreach/models.py",
    "backend/domain/monitoring/models.py"
]

for file in files_to_fix:
    with open(file, 'r') as f:
        content = f.read()

    # Add import uuid if needed
    if 'import uuid' not in content:
        content = content.replace('from uuid import uuid4', 'import uuid\nfrom uuid import uuid4')
        if 'import uuid' not in content:
           content = 'import uuid\n' + content

    if 'from sqlalchemy.orm import Mapped, mapped_column' not in content:
        content = content.replace('from sqlalchemy.orm import relationship', 'from sqlalchemy.orm import Mapped, mapped_column, relationship')

    # Remove the explicit id column since it inherits from Base
    content = re.sub(r'\s*id = Column\(String\(36\), primary_key=True, default=lambda: str\(uuid4\(\)\)\)', '', content)
    
    # Change lead_id String(36) -> Mapped[uuid.UUID]
    content = re.sub(
        r'lead_id = Column\(String\(36\), ForeignKey\("leads\.id", ondelete="CASCADE"\), nullable=False, index=True\)',
        r'lead_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)',
        content
    )
    
    # Change website_analysis_id String(36) -> Mapped[uuid.UUID | None]
    content = re.sub(
        r'website_analysis_id = Column\(String\(36\), ForeignKey\("website_analyses\.id", ondelete="SET NULL"\), nullable=True\)',
        r'website_analysis_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("website_analyses.id", ondelete="SET NULL"), nullable=True)',
        content
    )
    
    # Change qualification_id String(36) -> Mapped[uuid.UUID | None]
    content = re.sub(
        r'qualification_id = Column\(String\(36\), ForeignKey\("ai_qualifications\.id", ondelete="SET NULL"\), nullable=True\)',
        r'qualification_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("ai_qualifications.id", ondelete="SET NULL"), nullable=True)',
        content
    )

    with open(file, 'w') as f:
        f.write(content)
