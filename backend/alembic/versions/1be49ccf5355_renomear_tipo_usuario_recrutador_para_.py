"""renomear tipo_usuario recrutador para empresa

Revision ID: 1be49ccf5355
Revises: 789ac2832991
Create Date: 2026-09-04 15:34:01.059589

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1be49ccf5355'
down_revision: Union[str, Sequence[str], None] = '789ac2832991'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        "UPDATE cd_tipos_usuario SET codigo = 'empresa', nome = 'Empresa' "
        "WHERE codigo = 'recrutador'"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        "UPDATE cd_tipos_usuario SET codigo = 'recrutador', nome = 'Recrutador' "
        "WHERE codigo = 'empresa'"
    )
