"""empresa_id unico em cd_usuarios

Revision ID: 789ac2832991
Revises: db6eab5c2b16
Create Date: 2026-09-04 15:33:43.848393

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '789ac2832991'
down_revision: Union[str, Sequence[str], None] = 'db6eab5c2b16'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_unique_constraint("uq_usuarios_empresa_id", "cd_usuarios", ["empresa_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("uq_usuarios_empresa_id", "cd_usuarios", type_="unique")
