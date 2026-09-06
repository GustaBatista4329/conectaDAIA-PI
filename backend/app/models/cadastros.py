# Tabelas de cadastro (lookup tables) — valores gerenciáveis como dado, não
# fixados em código. Ver ESTRUTURA-BANCO-DE-DADOS.md, seção "Tabelas de
# cadastro", pro formato padrão (codigo/nome/ordem/ativo) e o porquê.
from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TipoUsuario(Base):
    __tablename__ = "cd_tipos_usuario"

    tipo_usuario_id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True)
    nome: Mapped[str] = mapped_column(String(100))
    ordem: Mapped[int | None] = mapped_column()
    ativo: Mapped[bool] = mapped_column(default=True)


class Nivel(Base):
    __tablename__ = "cd_niveis"

    nivel_id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True)
    nome: Mapped[str] = mapped_column(String(100))
    ordem: Mapped[int | None] = mapped_column()
    ativo: Mapped[bool] = mapped_column(default=True)


class CategoriaSkill(Base):
    __tablename__ = "cd_categorias_skill"

    categoria_skill_id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True)
    nome: Mapped[str] = mapped_column(String(100))
    ordem: Mapped[int | None] = mapped_column()
    ativo: Mapped[bool] = mapped_column(default=True)


class StatusValidacaoEmpresa(Base):
    __tablename__ = "cd_status_validacao_empresa"

    status_validacao_id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True)
    nome: Mapped[str] = mapped_column(String(100))
    ordem: Mapped[int | None] = mapped_column()
    ativo: Mapped[bool] = mapped_column(default=True)


class TipoContrato(Base):
    __tablename__ = "cd_tipos_contrato"

    tipo_contrato_id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True)
    nome: Mapped[str] = mapped_column(String(100))
    ordem: Mapped[int | None] = mapped_column()
    ativo: Mapped[bool] = mapped_column(default=True)


class StatusCandidatura(Base):
    __tablename__ = "cd_status_candidatura"

    status_id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True)
    nome: Mapped[str] = mapped_column(String(100))
    ordem: Mapped[int | None] = mapped_column()
    ativo: Mapped[bool] = mapped_column(default=True)


class TipoDenuncia(Base):
    __tablename__ = "cd_tipos_denuncia"

    tipo_id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True)
    nome: Mapped[str] = mapped_column(String(100))
    ordem: Mapped[int | None] = mapped_column()
    ativo: Mapped[bool] = mapped_column(default=True)


class StatusDenuncia(Base):
    __tablename__ = "cd_status_denuncia"

    status_id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True)
    nome: Mapped[str] = mapped_column(String(100))
    ordem: Mapped[int | None] = mapped_column()
    ativo: Mapped[bool] = mapped_column(default=True)
