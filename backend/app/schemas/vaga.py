# Schemas de Vaga + VagaFiltros
from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import Field, field_validator, model_validator

from app.models.enums import AreaProfissional, LocalTrabalho
from app.schemas.base import CamelModel

if TYPE_CHECKING:
    from app.models.vaga import Vaga


class VagaRead(CamelModel):
    """Formato de resposta da API. `nivel`/`tipo_contrato` saem como `nome`
    (rótulo de exibição, ex: "Sênior") — não como `codigo`. `salario_min`/
    `salario_max` ausentes juntos = "salário a combinar" (não preenchidos)."""

    id: int
    codigo: str
    titulo: str
    empresa_id: int
    empresa_nome: str
    area_profissional: AreaProfissional
    distrito: str
    local_trabalho: LocalTrabalho
    nivel: str
    salario_min: float | None = None
    salario_max: float | None = None
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
            area_profissional=vaga.area_profissional,
            distrito=vaga.distrito,
            local_trabalho=vaga.local_trabalho,
            nivel=vaga.nivel.nome,
            salario_min=float(vaga.salario_min) if vaga.salario_min is not None else None,
            salario_max=float(vaga.salario_max) if vaga.salario_max is not None else None,
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
    são o `codigo` do cadastro (ex: "senior"), não o nome de exibição.
    `salario_min`/`salario_max` são opcionais — deixar os dois de fora publica
    a vaga como "salário a combinar"; informar só um dos dois é erro."""

    titulo: str = Field(min_length=1)
    area_profissional: AreaProfissional
    distrito: str = Field(min_length=1)
    local_trabalho: LocalTrabalho
    nivel: str
    salario_min: float | None = Field(default=None, ge=0)
    salario_max: float | None = Field(default=None, ge=0)
    tipo_contrato: str
    descricao: str = Field(min_length=1)
    habilidades_requeridas: list[str] = Field(default_factory=list)

    @field_validator("habilidades_requeridas")
    @classmethod
    def _limpar_habilidades(cls, valor: list[str]) -> list[str]:
        """Remove espaços/entradas vazias e duplicatas (case-insensitive),
        preservando a primeira grafia digitada."""
        vistas: set[str] = set()
        limpas: list[str] = []
        for nome in valor:
            nome = nome.strip()
            if not nome or nome.lower() in vistas:
                continue
            vistas.add(nome.lower())
            limpas.append(nome)
        return limpas

    @model_validator(mode="after")
    def _validar_faixa_salarial(self) -> "VagaCreate":
        tem_min = self.salario_min is not None
        tem_max = self.salario_max is not None
        if tem_min != tem_max:
            raise ValueError(
                "Informe salário mínimo e máximo juntos, ou deixe os dois em branco "
                '(vaga "salário a combinar")'
            )
        if tem_min and tem_max and self.salario_max < self.salario_min:
            raise ValueError("Salário máximo não pode ser menor que o salário mínimo")
        return self


class VagaUpdate(CamelModel):
    """PATCH /vagas/{id} — só a empresa dona da vaga pode editar (RNE-001,
    checado no service via empresa_id do token, nunca do corpo). Todos os
    campos são opcionais: o service só altera o que vier no corpo (usa
    `model_dump(exclude_unset=True)`), então omitir um campo mantém o valor
    atual — é diferente de mandar `null`, que limpa o campo (só faz sentido
    pra salario_min/salario_max, pra voltar a vaga a "salário a combinar")."""

    titulo: str | None = Field(default=None, min_length=1)
    area_profissional: AreaProfissional | None = None
    distrito: str | None = Field(default=None, min_length=1)
    local_trabalho: LocalTrabalho | None = None
    nivel: str | None = None
    salario_min: float | None = Field(default=None, ge=0)
    salario_max: float | None = Field(default=None, ge=0)
    tipo_contrato: str | None = None
    descricao: str | None = Field(default=None, min_length=1)
    habilidades_requeridas: list[str] | None = None

    @field_validator("habilidades_requeridas")
    @classmethod
    def _limpar_habilidades(cls, valor: list[str] | None) -> list[str] | None:
        if valor is None:
            return None
        vistas: set[str] = set()
        limpas: list[str] = []
        for nome in valor:
            nome = nome.strip()
            if not nome or nome.lower() in vistas:
                continue
            vistas.add(nome.lower())
            limpas.append(nome)
        return limpas

    @model_validator(mode="after")
    def _validar_faixa_salarial(self) -> "VagaUpdate":
        campos = self.model_fields_set
        tem_min = "salario_min" in campos
        tem_max = "salario_max" in campos
        if tem_min != tem_max:
            raise ValueError(
                "Informe salario_min e salario_max juntos no PATCH (ou omita os dois — "
                "pra voltar a vaga a 'salário a combinar', envie os dois como null)"
            )
        if (
            tem_min
            and tem_max
            and self.salario_min is not None
            and self.salario_max is not None
            and self.salario_max < self.salario_min
        ):
            raise ValueError("Salário máximo não pode ser menor que o salário mínimo")
        return self


class VagaFiltros(CamelModel):
    """Query params de GET /vagas. `nivel` aqui também é `codigo`, igual ao
    VagaCreate — consistência: toda entrada usa codigo, toda saída usa nome."""

    termo: str | None = None
    area_profissional: AreaProfissional | None = None
    distrito: str | None = None
    local_trabalho: LocalTrabalho | None = None
    nivel: str | None = None
    salario_min: float | None = None
    salario_max: float | None = None
    apenas_ativas: bool = True
    empresa_id: int | None = None


class MatchResponse(CamelModel):
    match_percentual: int
