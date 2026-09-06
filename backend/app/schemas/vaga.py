# Schemas de Vaga + VagaFiltros
from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import Field

from app.schemas.base import CamelModel

if TYPE_CHECKING:
    from app.models.vaga import Vaga


class VagaRead(CamelModel):
    """Formato de resposta da API. `nivel`/`tipo_contrato` saem como `nome`
    (rótulo de exibição, ex: "Sênior") — não como `codigo`."""

    id: int
    codigo: str
    titulo: str
    empresa_id: int
    empresa_nome: str
    setor_atuacao: str
    distrito: str
    nivel: str
    salario_min: float
    salario_max: float
    tipo_contrato: str
    descricao: str
    habilidades_requeridas: list[str]
    ativa: bool
    data_publicacao: datetime
    total_candidatos: int
    match_percentual: int | None = None

    @classmethod
    def from_model(
        cls, vaga: "Vaga", *, total_candidatos: int, match_percentual: int | None = None
    ) -> "VagaRead":
        return cls(
            id=vaga.vaga_id,
            codigo=vaga.codigo,
            titulo=vaga.titulo,
            empresa_id=vaga.empresa_id,
            empresa_nome=vaga.empresa.nome,
            setor_atuacao=vaga.setor_atuacao,
            distrito=vaga.distrito,
            nivel=vaga.nivel.nome,
            salario_min=float(vaga.salario_min),
            salario_max=float(vaga.salario_max),
            tipo_contrato=vaga.tipo_contrato.nome,
            descricao=vaga.descricao,
            habilidades_requeridas=[h.nome for h in vaga.habilidades],
            ativa=vaga.ativa,
            data_publicacao=vaga.data_publicacao,
            total_candidatos=total_candidatos,
            match_percentual=match_percentual,
        )


class VagaCreate(CamelModel):
    """POST /vagas — só `empresa` autenticada. `empresa_id` não vem do corpo,
    é o da própria empresa logada (ver router). `nivel`/`tipo_contrato` aqui
    são o `codigo` do cadastro (ex: "senior"), não o nome de exibição."""

    titulo: str
    setor_atuacao: str
    distrito: str
    nivel: str
    salario_min: float = Field(ge=0)
    salario_max: float = Field(ge=0)
    tipo_contrato: str
    descricao: str
    habilidades_requeridas: list[str] = Field(default_factory=list)


class VagaFiltros(CamelModel):
    """Query params de GET /vagas. `nivel` aqui também é `codigo`, igual ao
    VagaCreate — consistência: toda entrada usa codigo, toda saída usa nome."""

    termo: str | None = None
    setor: str | None = None
    distrito: str | None = None
    nivel: str | None = None
    salario_min: float | None = None
    salario_max: float | None = None
    apenas_ativas: bool = True
    empresa_id: int | None = None


class MatchResponse(CamelModel):
    match_percentual: int
