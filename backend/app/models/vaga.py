# Models: Vaga (cd_vagas), VagaHabilidade (cd_vaga_habilidades)
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.cadastros import Nivel, TipoContrato
    from app.models.candidatura import Candidatura
    from app.models.empresa import Empresa


class Vaga(Base):
    __tablename__ = "cd_vagas"

    vaga_id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String, unique=True)
    titulo: Mapped[str] = mapped_column(String)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("cd_empresas.empresa_id"))
    setor_atuacao: Mapped[str] = mapped_column(String)
    distrito: Mapped[str] = mapped_column(String)
    nivel_id: Mapped[int] = mapped_column(ForeignKey("cd_niveis.nivel_id"))
    salario_min: Mapped[float] = mapped_column(Numeric(10, 2))
    salario_max: Mapped[float] = mapped_column(Numeric(10, 2))
    tipo_contrato_id: Mapped[int] = mapped_column(ForeignKey("cd_tipos_contrato.tipo_contrato_id"))
    descricao: Mapped[str] = mapped_column(Text)
    ativa: Mapped[bool] = mapped_column(default=True)
    data_publicacao: Mapped[datetime] = mapped_column(server_default=func.now())

    # empresaNome, totalCandidatos, matchPercentual não são colunas (decisões 3 e 5)
    empresa: Mapped[Empresa] = relationship(back_populates="vagas")
    nivel: Mapped[Nivel] = relationship()
    tipo_contrato: Mapped[TipoContrato] = relationship()
    habilidades: Mapped[list[VagaHabilidade]] = relationship(
        back_populates="vaga", cascade="all, delete-orphan"
    )
    candidaturas: Mapped[list[Candidatura]] = relationship(back_populates="vaga")


class VagaHabilidade(Base):
    __tablename__ = "cd_vaga_habilidades"

    vaga_habilidade_id: Mapped[int] = mapped_column(primary_key=True)
    vaga_id: Mapped[int] = mapped_column(ForeignKey("cd_vagas.vaga_id"))
    nome: Mapped[str] = mapped_column(String)

    vaga: Mapped[Vaga] = relationship(back_populates="habilidades")
