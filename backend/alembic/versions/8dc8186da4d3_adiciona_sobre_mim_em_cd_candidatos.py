"""adiciona sobre_mim em cd_candidatos

Revision ID: 8dc8186da4d3
Revises: 1be49ccf5355
Create Date: 2026-09-12 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8dc8186da4d3'
down_revision: Union[str, Sequence[str], None] = '1be49ccf5355'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("cd_candidatos", sa.Column("sobre_mim", sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("cd_candidatos", "sobre_mim")
