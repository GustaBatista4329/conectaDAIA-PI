"""cria formacoes academicas

Revision ID: 6c9708ce64c1
Revises: 5ac0933c41e7
Create Date: 2026-09-12 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6c9708ce64c1'
down_revision: Union[str, Sequence[str], None] = '5ac0933c41e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Mesmos valores de app.models.candidato.AreaEstudo — mantidos em sincronia
# manualmente (é um Enum Python fixo, não uma tabela de cadastro).
AREA_ESTUDO_VALUES = (
    "EDUCACAO",
    "ARTES_E_HUMANIDADES",
    "CIENCIAS_SOCIAIS_E_COMPORTAMENTAIS",
    "COMUNICACAO_E_INFORMACAO",
    "NEGOCIOS_E_ADMINISTRACAO",
    "DIREITO",
    "CIENCIAS_NATURAIS",
    "MATEMATICA_E_ESTATISTICA",
    "COMPUTACAO_E_TECNOLOGIA_DA_INFORMACAO",
    "ENGENHARIAS",
    "ARQUITETURA_E_CONSTRUCAO",
    "PRODUCAO_INDUSTRIAL",
    "AGRICULTURA_E_VETERINARIA",
    "SAUDE_E_BEM_ESTAR",
    "TURISMO_HOTELARIA_E_GASTRONOMIA",
    "SEGURANCA_E_DEFESA",
    "TRANSPORTES",
    "INTERDISCIPLINAR",
    "OTHER",
)


def upgrade() -> None:
    """Upgrade schema."""
    # Não cria o tipo Enum separadamente — `create_table` já cria o tipo
    # `area_estudo` no Postgres automaticamente ao usar a coluna abaixo
    # (criar antes E aqui causa "type already exists").
    area_estudo_enum = sa.Enum(*AREA_ESTUDO_VALUES, name="area_estudo")

    op.create_table(
        'cd_formacoes_academicas',
        sa.Column('formacao_id', sa.Integer(), nullable=False),
        sa.Column('candidato_id', sa.Integer(), nullable=False),
        sa.Column('instituicao', sa.String(), nullable=False),
        sa.Column('curso', sa.String(), nullable=False),
        sa.Column('area_estudo', area_estudo_enum, nullable=False),
        sa.Column('data_inicio', sa.Date(), nullable=False),
        sa.Column('data_formatura', sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(['candidato_id'], ['cd_candidatos.candidato_id'], ),
        sa.PrimaryKeyConstraint('formacao_id'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('cd_formacoes_academicas')
    sa.Enum(name="area_estudo").drop(op.get_bind(), checkfirst=True)
