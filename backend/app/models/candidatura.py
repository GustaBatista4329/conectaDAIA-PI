# Model: Candidatura (cd_candidaturas)
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.cadastros import StatusCandidatura
    from app.models.candidato import Candidato
    from app.models.vaga import Vaga


class Candidatura(Base):
    __tablename__ = "cd_candidaturas"
    __table_args__ = (
        UniqueConstraint("candidato_id", "vaga_id", name="uq_candidatura_candidato_vaga"),
    )

    candidatura_id: Mapped[int] = mapped_column(primary_key=True)
    candidato_id: Mapped[int] = mapped_column(ForeignKey("cd_candidatos.candidato_id"))
    vaga_id: Mapped[int] = mapped_column(ForeignKey("cd_vagas.vaga_id"))
    status_id: Mapped[int] = mapped_column(ForeignKey("cd_status_candidatura.status_id"))
    data_aplicacao: Mapped[datetime] = mapped_column(server_default=func.now())
    parecer_rh: Mapped[str | None] = mapped_column(Text)
    parecer_tecnico: Mapped[str | None] = mapped_column(Text)
    data_entrevista: Mapped[datetime | None] = mapped_column()

    candidato: Mapped[Candidato] = relationship(back_populates="candidaturas")
    vaga: Mapped[Vaga] = relationship(back_populates="candidaturas")
    status: Mapped[StatusCandidatura] = relationship()
