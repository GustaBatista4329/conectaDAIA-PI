# Model: Empresa (cd_empresas)
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.cadastros import StatusValidacaoEmpresa
    from app.models.user import User
    from app.models.vaga import Vaga


class Empresa(Base):
    __tablename__ = "cd_empresas"

    empresa_id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String)
    cnpj: Mapped[str] = mapped_column(String(18), unique=True)
    setor: Mapped[str] = mapped_column(String)
    status_validacao_id: Mapped[int] = mapped_column(
        ForeignKey("cd_status_validacao_empresa.status_validacao_id")
    )
    sede: Mapped[str] = mapped_column(String)
    logo_inicial: Mapped[str] = mapped_column(String)

    # totalVagasAtivas não é coluna — é derivado por query (ver decisão 5)
    status_validacao: Mapped[StatusValidacaoEmpresa] = relationship()
    usuario: Mapped[User | None] = relationship(back_populates="empresa", uselist=False)
    vagas: Mapped[list[Vaga]] = relationship(back_populates="empresa")
