# Schemas de Denuncia, LogAuditoria, MetricasPlataforma
from datetime import datetime
from typing import TYPE_CHECKING, Literal

from app.schemas.base import CamelModel

if TYPE_CHECKING:
    from app.models.admin import Denuncia, LogAuditoria


class DenunciaRead(CamelModel):
    id: int
    tipo: str  # codigo
    alvo: str
    descricao: str
    status: str  # codigo
    criada_em: datetime

    @classmethod
    def from_model(cls, denuncia: "Denuncia") -> "DenunciaRead":
        return cls(
            id=denuncia.denuncia_id,
            tipo=denuncia.tipo.codigo,
            alvo=denuncia.alvo,
            descricao=denuncia.descricao,
            status=denuncia.status.codigo,
            criada_em=denuncia.criada_em,
        )


class LogAuditoriaRead(CamelModel):
    id: int
    tipo: str
    descricao: str
    alvo_id: str
    criado_em: datetime

    @classmethod
    def from_model(cls, log: "LogAuditoria") -> "LogAuditoriaRead":
        return cls(
            id=log.log_auditoria_id,
            tipo=log.tipo,
            descricao=log.descricao,
            alvo_id=log.alvo_id,
            criado_em=log.criado_em,
        )


class MetricasRead(CamelModel):
    """Todo campo é calculado por query — não existe tabela de métricas (ver
    decisão 6 do ESTRUTURA-BANCO-DE-DADOS.md)."""

    vagas_ativas: int
    novos_candidatos: int
    empresas_validadas: int
    tempo_medio_contratacao: float  # dias
    denuncias_pendentes: int


class ResolverDenunciaRequest(CamelModel):
    acao: Literal["investigar", "ignorar", "suspender"]


class SeedDemoResponse(CamelModel):
    candidatos: int
    empresas: int
    vagas: int
    candidaturas: int
    denuncias: int
