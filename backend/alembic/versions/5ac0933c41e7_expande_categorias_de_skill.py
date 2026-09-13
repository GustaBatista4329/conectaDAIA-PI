"""expande categorias de skill

Revision ID: 5ac0933c41e7
Revises: eb2ca4e8061e
Create Date: 2026-09-12 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5ac0933c41e7'
down_revision: Union[str, Sequence[str], None] = 'eb2ca4e8061e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Categorias adicionadas por pedido do usuário (áreas técnicas, de negócio e
# comportamentais), mais 2 sugestões de pesquisa ao final (inovação/criatividade
# e adaptabilidade — competências comportamentais recorrentes em taxonomias de
# vaga que complementam o grupo já pedido). "Idiomas" já existe (seed inicial),
# não é reinserida aqui.
NOVAS_CATEGORIAS = [
    {"codigo": "desenvolvimento_software", "nome": "Desenvolvimento de Software", "ordem": 6},
    {"codigo": "analise_dados_bi", "nome": "Análise de Dados & BI", "ordem": 7},
    {"codigo": "design_ux_ui", "nome": "Design & UX/UI", "ordem": 8},
    {"codigo": "gestao_projetos", "nome": "Gestão de Projetos", "ordem": 9},
    {"codigo": "marketing_digital", "nome": "Marketing Digital", "ordem": 10},
    {"codigo": "vendas_negociacao", "nome": "Vendas & Negociação", "ordem": 11},
    {"codigo": "financas_contabilidade", "nome": "Finanças & Contabilidade", "ordem": 12},
    {"codigo": "gestao_rh_do", "nome": "Gestão de RH & D&O", "ordem": 13},
    {"codigo": "operacoes_logistica", "nome": "Operações & Logística", "ordem": 14},
    {"codigo": "seguranca_informacao", "nome": "Segurança da Informação", "ordem": 15},
    {"codigo": "lideranca_gestao_pessoas", "nome": "Liderança & Gestão de Pessoas", "ordem": 16},
    {"codigo": "comunicacao_interpessoal", "nome": "Comunicação Interpessoal", "ordem": 17},
    {"codigo": "resolucao_problemas", "nome": "Resolução de Problemas", "ordem": 18},
    {"codigo": "trabalho_equipe", "nome": "Trabalho em Equipe", "ordem": 19},
    {"codigo": "organizacao_gestao_tempo", "nome": "Organização & Gestão do Tempo", "ordem": 20},
    {"codigo": "pensamento_estrategico", "nome": "Pensamento Estratégico", "ordem": 21},
    {"codigo": "software_ferramentas", "nome": "Software & Ferramentas", "ordem": 22},
    {"codigo": "compliance_governanca", "nome": "Compliance & Governança", "ordem": 23},
    {"codigo": "atendimento_sucesso_cliente", "nome": "Atendimento & Sucesso do Cliente", "ordem": 24},
    {"codigo": "inovacao_criatividade", "nome": "Inovação & Criatividade", "ordem": 25},
    {"codigo": "adaptabilidade_flexibilidade", "nome": "Adaptabilidade & Flexibilidade", "ordem": 26},
]


def _table() -> sa.Table:
    return sa.table(
        "cd_categorias_skill",
        sa.column("codigo", sa.String),
        sa.column("nome", sa.String),
        sa.column("ordem", sa.Integer),
        sa.column("ativo", sa.Boolean),
    )


def upgrade() -> None:
    """Upgrade schema."""
    op.bulk_insert(_table(), [{**c, "ativo": True} for c in NOVAS_CATEGORIAS])


def downgrade() -> None:
    """Downgrade schema."""
    codigos = tuple(c["codigo"] for c in NOVAS_CATEGORIAS)
    op.execute(f"DELETE FROM cd_categorias_skill WHERE codigo IN {codigos}")
