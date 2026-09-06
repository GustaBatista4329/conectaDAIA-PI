# Models: Denuncia (cd_denuncias), LogAuditoria (cd_logs_auditoria)
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.cadastros import StatusDenuncia, TipoDenuncia


class Denuncia(Base):
    __tablename__ = "cd_denuncias"

    denuncia_id: Mapped[int] = mapped_column(primary_key=True)
    tipo_id: Mapped[int] = mapped_column(ForeignKey("cd_tipos_denuncia.tipo_id"))
    alvo: Mapped[str] = mapped_column(String)
    descricao: Mapped[str] = mapped_column(Text)
    status_id: Mapped[int] = mapped_column(ForeignKey("cd_status_denuncia.status_id"))
    criada_em: Mapped[datetime] = mapped_column(server_default=func.now())

    tipo: Mapped[TipoDenuncia] = relationship()
    status: Mapped[StatusDenuncia] = relationship()


class LogAuditoria(Base):
    __tablename__ = "cd_logs_auditoria"

    log_auditoria_id: Mapped[int] = mapped_column(primary_key=True)
    tipo: Mapped[str] = mapped_column(String)
    descricao: Mapped[str] = mapped_column(Text)
    alvo_id: Mapped[str] = mapped_column(String)
    criado_em: Mapped[datetime] = mapped_column(server_default=func.now())
