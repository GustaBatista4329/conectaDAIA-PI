# Models: Candidato (cd_candidatos), Skill (cd_skills), Certificacao
# (cd_certificacoes), Formacao (cd_formacoes_academicas), Experiencia
# (cd_experiencias_profissionais)
from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SQLEnum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import AreaEstudo, LocalTrabalho, TipoTrabalho

if TYPE_CHECKING:
    from app.models.cadastros import CategoriaSkill, Nivel
    from app.models.candidatura import Candidatura
    from app.models.user import User


class Candidato(Base):
    __tablename__ = "cd_candidatos"

    candidato_id: Mapped[int] = mapped_column(primary_key=True)
    cargo: Mapped[str] = mapped_column(String)
    nivel_id: Mapped[int] = mapped_column(ForeignKey("cd_niveis.nivel_id"))
    setor_atuacao: Mapped[str] = mapped_column(String)
    localidade: Mapped[str] = mapped_column(String)
    anos_experiencia: Mapped[int] = mapped_column()
    perfil_completo: Mapped[int] = mapped_column(default=0)
    curriculo_url: Mapped[str | None] = mapped_column(String)
    alertas_ativos: Mapped[bool] = mapped_column(default=True)
    sobre_mim: Mapped[str | None] = mapped_column(Text)

    # nome/email do candidato NÃO estão aqui — vêm de User (ver decisão 2 do
    # docs/ESTRUTURA-BANCO-DE-DADOS.md)
    nivel: Mapped[Nivel] = relationship()
    usuario: Mapped[User | None] = relationship(back_populates="candidato", uselist=False)
    skills: Mapped[list[Skill]] = relationship(
        back_populates="candidato", cascade="all, delete-orphan"
    )
    certificacoes: Mapped[list[Certificacao]] = relationship(
        back_populates="candidato", cascade="all, delete-orphan"
    )
    formacoes: Mapped[list[Formacao]] = relationship(
        back_populates="candidato", cascade="all, delete-orphan"
    )
    experiencias: Mapped[list[Experiencia]] = relationship(
        back_populates="candidato", cascade="all, delete-orphan"
    )
    candidaturas: Mapped[list[Candidatura]] = relationship(back_populates="candidato")


class Skill(Base):
    __tablename__ = "cd_skills"
    __table_args__ = (UniqueConstraint("candidato_id", "nome", name="uq_skill_candidato_nome"),)

    skill_id: Mapped[int] = mapped_column(primary_key=True)
    candidato_id: Mapped[int] = mapped_column(ForeignKey("cd_candidatos.candidato_id"))
    nome: Mapped[str] = mapped_column(String)
    categoria_skill_id: Mapped[int] = mapped_column(
        ForeignKey("cd_categorias_skill.categoria_skill_id")
    )

    candidato: Mapped[Candidato] = relationship(back_populates="skills")
    categoria: Mapped[CategoriaSkill] = relationship()


class Certificacao(Base):
    __tablename__ = "cd_certificacoes"

    certificacao_id: Mapped[int] = mapped_column(primary_key=True)
    candidato_id: Mapped[int] = mapped_column(ForeignKey("cd_candidatos.candidato_id"))
    nome: Mapped[str] = mapped_column(String)
    validada: Mapped[bool] = mapped_column(default=False)

    candidato: Mapped[Candidato] = relationship(back_populates="certificacoes")


class Formacao(Base):
    __tablename__ = "cd_formacoes_academicas"

    formacao_id: Mapped[int] = mapped_column(primary_key=True)
    candidato_id: Mapped[int] = mapped_column(ForeignKey("cd_candidatos.candidato_id"))
    instituicao: Mapped[str] = mapped_column(String)
    curso: Mapped[str] = mapped_column(String)
    area_estudo: Mapped[AreaEstudo] = mapped_column(SQLEnum(AreaEstudo, name="area_estudo"))
    data_inicio: Mapped[date] = mapped_column()
    # Pode ser uma data futura — formação ainda em andamento (previsão de
    # formatura), não só concluída.
    data_formatura: Mapped[date] = mapped_column()

    candidato: Mapped[Candidato] = relationship(back_populates="formacoes")


class Experiencia(Base):
    __tablename__ = "cd_experiencias_profissionais"

    experiencia_id: Mapped[int] = mapped_column(primary_key=True)
    candidato_id: Mapped[int] = mapped_column(ForeignKey("cd_candidatos.candidato_id"))
    # Nome livre — não é FK para cd_empresas: o empregador de uma experiência
    # passada não precisa estar cadastrado na plataforma.
    empresa_nome: Mapped[str] = mapped_column(String)
    cargo: Mapped[str] = mapped_column(String)
    tipo_trabalho: Mapped[TipoTrabalho] = mapped_column(SQLEnum(TipoTrabalho, name="tipo_trabalho"))
    local_trabalho: Mapped[LocalTrabalho] = mapped_column(
        SQLEnum(LocalTrabalho, name="local_trabalho")
    )
    data_inicio: Mapped[date] = mapped_column()
    # None quando trabalhando_atualmente=True (validado no schema).
    data_fim: Mapped[date | None] = mapped_column()
    trabalhando_atualmente: Mapped[bool] = mapped_column(default=False)

    candidato: Mapped[Candidato] = relationship(back_populates="experiencias")
