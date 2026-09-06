# Model: User (cd_usuarios) — identidade + autenticação
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.cadastros import TipoUsuario
    from app.models.candidato import Candidato
    from app.models.empresa import Empresa


class User(Base):
    __tablename__ = "cd_usuarios"

    user_id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True)
    senha_hash: Mapped[str] = mapped_column(String)
    nome: Mapped[str] = mapped_column(String)
    tipo_usuario_id: Mapped[int] = mapped_column(ForeignKey("cd_tipos_usuario.tipo_usuario_id"))
    avatar_url: Mapped[str | None] = mapped_column(String)
    candidato_id: Mapped[int | None] = mapped_column(
        ForeignKey("cd_candidatos.candidato_id"), unique=True
    )
    empresa_id: Mapped[int | None] = mapped_column(
        ForeignKey("cd_empresas.empresa_id"), unique=True
    )
    criado_em: Mapped[datetime] = mapped_column(server_default=func.now())

    tipo_usuario: Mapped[TipoUsuario] = relationship()
    candidato: Mapped[Candidato | None] = relationship(back_populates="usuario")
    empresa: Mapped[Empresa | None] = relationship(back_populates="usuario")
