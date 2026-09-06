# Schemas de Empresa
from typing import TYPE_CHECKING

from pydantic import EmailStr, Field

from app.schemas.base import CamelModel

if TYPE_CHECKING:
    from app.models.empresa import Empresa


class EmpresaCreate(CamelModel):
    """Cadastro público de empresa — cria User (role=empresa) + Empresa juntos."""

    email: EmailStr
    senha: str = Field(min_length=8)
    nome: str
    cnpj: str = Field(min_length=14, max_length=18)
    setor: str
    sede: str


class EmpresaRead(CamelModel):
    """`totalVagasAtivas` não é coluna — sempre derivado por query (decisão 5
    do ESTRUTURA-BANCO-DE-DADOS.md), por isso vem como parâmetro de `from_model`."""

    id: int
    nome: str
    cnpj: str
    setor: str
    status_validacao: str  # codigo (em_analise/validada/divergencia_rfb/suspensa)
    sede: str
    logo_inicial: str
    total_vagas_ativas: int

    @classmethod
    def from_model(cls, empresa: "Empresa", *, total_vagas_ativas: int) -> "EmpresaRead":
        return cls(
            id=empresa.empresa_id,
            nome=empresa.nome,
            cnpj=empresa.cnpj,
            setor=empresa.setor,
            status_validacao=empresa.status_validacao.codigo,
            sede=empresa.sede,
            logo_inicial=empresa.logo_inicial,
            total_vagas_ativas=total_vagas_ativas,
        )
