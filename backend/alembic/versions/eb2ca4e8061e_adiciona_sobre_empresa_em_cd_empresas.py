"""adiciona sobre_empresa em cd_empresas

Revision ID: eb2ca4e8061e
Revises: 8dc8186da4d3
Create Date: 2026-09-12 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eb2ca4e8061e'
down_revision: Union[str, Sequence[str], None] = '8dc8186da4d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("cd_empresas", sa.Column("sobre_empresa", sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("cd_empresas", "sobre_empresa")
