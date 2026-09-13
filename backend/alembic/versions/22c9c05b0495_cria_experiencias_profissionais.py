"""cria experiencias profissionais

Revision ID: 22c9c05b0495
Revises: 6c9708ce64c1
Create Date: 2026-09-12 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '22c9c05b0495'
down_revision: Union[str, Sequence[str], None] = '6c9708ce64c1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Mesmos valores de app.models.candidato.TipoTrabalho / LocalTrabalho —
# mantidos em sincronia manualmente (são Enums Python fixos, não cadastro).
TIPO_TRABALHO_VALUES = (
    "TEMPO_INTEGRAL",
    "MEIO_PERIODO",
    "AUTONOMO",
    "FREELANCER",
    "CONTRATO",
    "ESTAGIO",
    "APRENDIZ",
    "CONTRATO_INDIRETO",
    "PROGRAMA_DE_LIDERANCA",
    "OTHER",
)
LOCAL_TRABALHO_VALUES = ("PRESENCIAL", "HIBRIDO", "REMOTO")


def upgrade() -> None:
    """Upgrade schema."""
    tipo_trabalho_enum = sa.Enum(*TIPO_TRABALHO_VALUES, name="tipo_trabalho")
    local_trabalho_enum = sa.Enum(*LOCAL_TRABALHO_VALUES, name="local_trabalho")

    op.create_table(
        'cd_experiencias_profissionais',
        sa.Column('experiencia_id', sa.Integer(), nullable=False),
        sa.Column('candidato_id', sa.Integer(), nullable=False),
        sa.Column('empresa_nome', sa.String(), nullable=False),
        sa.Column('cargo', sa.String(), nullable=False),
        sa.Column('tipo_trabalho', tipo_trabalho_enum, nullable=False),
        sa.Column('local_trabalho', local_trabalho_enum, nullable=False),
        sa.Column('data_inicio', sa.Date(), nullable=False),
        sa.Column('data_fim', sa.Date(), nullable=True),
        sa.Column('trabalhando_atualmente', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['candidato_id'], ['cd_candidatos.candidato_id'], ),
        sa.PrimaryKeyConstraint('experiencia_id'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('cd_experiencias_profissionais')
    sa.Enum(name="tipo_trabalho").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="local_trabalho").drop(op.get_bind(), checkfirst=True)
