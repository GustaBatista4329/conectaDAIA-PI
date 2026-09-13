"""area_profissional, salario opcional e tipo_contrato em portugues

Revision ID: 952b6c10aad6
Revises: a0fd7f0ef7aa
Create Date: 2026-09-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '952b6c10aad6'
down_revision: Union[str, Sequence[str], None] = 'a0fd7f0ef7aa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Mesmos valores de app.models.enums.AreaProfissional — mantidos em
# sincronia manualmente (é um Enum Python fixo, não uma tabela de cadastro).
AREA_PROFISSIONAL_VALUES = (
    "ADMINISTRACAO", "RECURSOS_HUMANOS", "JURIDICO_ADVOCACIA", "CONTABILIDADE",
    "FINANCEIRO", "MARKETING", "VENDAS_COMERCIAL", "ATENDIMENTO_AO_CLIENTE",
    "TECNOLOGIA_DA_INFORMACAO", "ENGENHARIA_CIVIL", "ENGENHARIA_MECANICA",
    "ENGENHARIA_ELETRICA", "ENGENHARIA_DE_PRODUCAO", "ENGENHARIA_QUIMICA",
    "ENGENHARIA_DE_ALIMENTOS", "ENGENHARIA_AMBIENTAL", "ARQUITETURA", "LOGISTICA",
    "COMPRAS_SUPRIMENTOS", "PRODUCAO_OPERACOES_INDUSTRIAIS", "MANUTENCAO_INDUSTRIAL",
    "QUALIDADE", "SEGURANCA_DO_TRABALHO", "SAUDE_E_MEDICINA", "ENFERMAGEM",
    "FARMACIA", "NUTRICAO", "PSICOLOGIA", "EDUCACAO_DOCENCIA", "DESIGN_GRAFICO",
    "COMUNICACAO_JORNALISMO", "PUBLICIDADE_E_PROPAGANDA", "RECEPCAO_SECRETARIADO",
    "ALMOXARIFADO", "TRANSPORTE_MOTORISTA", "CONSTRUCAO_CIVIL", "ELETRICISTA",
    "MECANICA_AUTOMOTIVA", "METALURGIA_SOLDA", "AGRONOMIA", "VETERINARIA",
    "ZOOTECNIA", "MEIO_AMBIENTE_SUSTENTABILIDADE", "AUDITORIA", "CONTROLADORIA",
    "ECONOMIA", "ESTATISTICA_CIENCIA_DE_DADOS", "BIOMEDICINA",
    "BIOLOGIA_BIOTECNOLOGIA", "QUIMICA_LABORATORIO", "TURISMO_HOTELARIA",
    "GASTRONOMIA", "SERVICOS_GERAIS_LIMPEZA", "SEGURANCA_PATRIMONIAL",
    "TELECOMUNICACOES", "ELETRONICA", "AUTOMACAO_INDUSTRIAL", "COMERCIO_EXTERIOR",
    "RELACOES_PUBLICAS", "GESTAO_DE_PROJETOS", "OUTRA",
)


def upgrade() -> None:
    """Upgrade schema."""
    # cd_vagas ainda está vazia neste ambiente (feature nova, sem uso real
    # ainda) — troca direta de coluna, sem migração de dados.
    op.drop_column("cd_vagas", "setor_atuacao")

    # `op.add_column` (ao contrário de `op.create_table`) não cria o tipo
    # Enum sozinho — precisa criar explicitamente antes, com create_type=False
    # na coluna em si pra não tentar recriá-lo.
    area_profissional_enum = postgresql.ENUM(
        *AREA_PROFISSIONAL_VALUES, name="area_profissional"
    )
    area_profissional_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "cd_vagas",
        sa.Column(
            "area_profissional",
            postgresql.ENUM(*AREA_PROFISSIONAL_VALUES, name="area_profissional", create_type=False),
            nullable=False,
        ),
    )

    # Salário deixa de ser obrigatório — ausente = "salário a combinar".
    op.alter_column("cd_vagas", "salario_min", nullable=True)
    op.alter_column("cd_vagas", "salario_max", nullable=True)

    # Tipo de contrato em português (só o `nome` de exibição muda; `codigo`
    # continua estável para não quebrar nada que já referencie full_time/
    # urgent_hire).
    op.execute("UPDATE cd_tipos_contrato SET nome = 'Tempo Integral' WHERE codigo = 'full_time'")
    op.execute(
        "UPDATE cd_tipos_contrato SET nome = 'Contratação Urgente' WHERE codigo = 'urgent_hire'"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("UPDATE cd_tipos_contrato SET nome = 'Full-time' WHERE codigo = 'full_time'")
    op.execute("UPDATE cd_tipos_contrato SET nome = 'Urgent Hire' WHERE codigo = 'urgent_hire'")

    op.alter_column("cd_vagas", "salario_max", nullable=False)
    op.alter_column("cd_vagas", "salario_min", nullable=False)

    op.drop_column("cd_vagas", "area_profissional")
    sa.Enum(name="area_profissional").drop(op.get_bind(), checkfirst=True)

    op.add_column("cd_vagas", sa.Column("setor_atuacao", sa.String(), nullable=False))
