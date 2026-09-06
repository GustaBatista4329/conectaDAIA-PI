"""seed cadastros iniciais

Revision ID: db6eab5c2b16
Revises: 717e70bd40da
Create Date: 2026-09-04 14:55:37.884730

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'db6eab5c2b16'
down_revision: Union[str, Sequence[str], None] = '717e70bd40da'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


CADASTROS = {
    "cd_tipos_usuario": [
        {"codigo": "candidato", "nome": "Candidato", "ordem": 1, "ativo": True},
        {"codigo": "recrutador", "nome": "Recrutador", "ordem": 2, "ativo": True},
        {"codigo": "admin", "nome": "Administrador", "ordem": 3, "ativo": True},
    ],
    "cd_niveis": [
        {"codigo": "junior", "nome": "Junior", "ordem": 1, "ativo": True},
        {"codigo": "pleno", "nome": "Pleno", "ordem": 2, "ativo": True},
        {"codigo": "senior", "nome": "Sênior", "ordem": 3, "ativo": True},
        {"codigo": "gerencia", "nome": "Gerência", "ordem": 4, "ativo": True},
    ],
    "cd_categorias_skill": [
        {"codigo": "operacao_manutencao", "nome": "Operação e Manutenção", "ordem": 1, "ativo": True},
        {"codigo": "normas_seguranca", "nome": "Normas e Segurança", "ordem": 2, "ativo": True},
        {"codigo": "gestao", "nome": "Gestão", "ordem": 3, "ativo": True},
        {"codigo": "tecnica", "nome": "Técnica", "ordem": 4, "ativo": True},
        {"codigo": "idiomas", "nome": "Idiomas", "ordem": 5, "ativo": True},
    ],
    "cd_status_validacao_empresa": [
        {"codigo": "em_analise", "nome": "Em Análise", "ordem": 1, "ativo": True},
        {"codigo": "validada", "nome": "Validada", "ordem": 2, "ativo": True},
        {"codigo": "divergencia_rfb", "nome": "Divergência RFB", "ordem": 3, "ativo": True},
        {"codigo": "suspensa", "nome": "Suspensa", "ordem": 4, "ativo": True},
    ],
    "cd_tipos_contrato": [
        {"codigo": "full_time", "nome": "Full-time", "ordem": 1, "ativo": True},
        {"codigo": "urgent_hire", "nome": "Urgent Hire", "ordem": 2, "ativo": True},
        {"codigo": "meio_periodo", "nome": "Meio Período", "ordem": 3, "ativo": True},
        {"codigo": "temporario", "nome": "Temporário", "ordem": 4, "ativo": True},
    ],
    "cd_status_candidatura": [
        {"codigo": "triagem", "nome": "Triagem", "ordem": 1, "ativo": True},
        {"codigo": "entrevista_rh", "nome": "Entrevista RH", "ordem": 2, "ativo": True},
        {"codigo": "avaliacao_tecnica", "nome": "Avaliação Técnica", "ordem": 3, "ativo": True},
        {"codigo": "contratado", "nome": "Contratado", "ordem": 4, "ativo": True},
        {"codigo": "recusado", "nome": "Recusado", "ordem": 5, "ativo": True},
    ],
    "cd_tipos_denuncia": [
        {"codigo": "vaga_falsa", "nome": "Vaga Falsa", "ordem": 1, "ativo": True},
        {"codigo": "comportamento_inadequado", "nome": "Comportamento Inadequado", "ordem": 2, "ativo": True},
        {"codigo": "fraude", "nome": "Fraude", "ordem": 3, "ativo": True},
        {"codigo": "outro", "nome": "Outro", "ordem": 4, "ativo": True},
    ],
    "cd_status_denuncia": [
        {"codigo": "pendente", "nome": "Pendente", "ordem": 1, "ativo": True},
        {"codigo": "em_investigacao", "nome": "Em Investigação", "ordem": 2, "ativo": True},
        {"codigo": "resolvida", "nome": "Resolvida", "ordem": 3, "ativo": True},
        {"codigo": "ignorada", "nome": "Ignorada", "ordem": 4, "ativo": True},
    ],
}


def _table(name: str) -> sa.Table:
    return sa.table(
        name,
        sa.column("codigo", sa.String),
        sa.column("nome", sa.String),
        sa.column("ordem", sa.Integer),
        sa.column("ativo", sa.Boolean),
    )


def upgrade() -> None:
    """Upgrade schema."""
    for table_name, rows in CADASTROS.items():
        op.bulk_insert(_table(table_name), rows)


def downgrade() -> None:
    """Downgrade schema."""
    for table_name in CADASTROS:
        op.execute(f"DELETE FROM {table_name}")
