"""adiciona local_trabalho em cd_vagas

Revision ID: a0fd7f0ef7aa
Revises: 22c9c05b0495
Create Date: 2026-09-12 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a0fd7f0ef7aa'
down_revision: Union[str, Sequence[str], None] = '22c9c05b0495'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

LOCAL_TRABALHO_VALUES = ("PRESENCIAL", "HIBRIDO", "REMOTO")


def upgrade() -> None:
    """Upgrade schema."""
    # O tipo `local_trabalho` já existe no Postgres (criado na migração
    # 22c9c05b0495, para cd_experiencias_profissionais) — create_type=False
    # evita tentar recriá-lo aqui.
    local_trabalho_enum = postgresql.ENUM(
        *LOCAL_TRABALHO_VALUES, name="local_trabalho", create_type=False
    )
    op.add_column(
        "cd_vagas",
        sa.Column("local_trabalho", local_trabalho_enum, nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("cd_vagas", "local_trabalho")
