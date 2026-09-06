# Schemas de Candidatura
from datetime import datetime
from typing import TYPE_CHECKING, Literal

from app.schemas.base import CamelModel

if TYPE_CHECKING:
    from app.models.candidatura import Candidatura


class CandidaturaRead(CamelModel):
    id: int
    candidato_id: int
    vaga_id: int
    status: str  # codigo (triagem/entrevista_rh/avaliacao_tecnica/contratado/recusado)
    data_aplicacao: datetime
    parecer_rh: str | None = None
    parecer_tecnico: str | None = None
    data_entrevista: datetime | None = None

    @classmethod
    def from_model(cls, candidatura: "Candidatura") -> "CandidaturaRead":
        return cls(
            id=candidatura.candidatura_id,
            candidato_id=candidatura.candidato_id,
            vaga_id=candidatura.vaga_id,
            status=candidatura.status.codigo,
            data_aplicacao=candidatura.data_aplicacao,
            parecer_rh=candidatura.parecer_rh,
            parecer_tecnico=candidatura.parecer_tecnico,
            data_entrevista=candidatura.data_entrevista,
        )


class CandidaturaCreate(CamelModel):
    """POST /candidaturas — só `candidato` autenticado. `candidato_id` não vem
    do corpo, é o do próprio candidato logado (ver router)."""

    vaga_id: int


class StatusUpdate(CamelModel):
    status: str  # codigo


class ParecerUpdate(CamelModel):
    tipo: Literal["rh", "tecnico"]
    texto: str
