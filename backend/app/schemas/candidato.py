# Schemas de Candidato, Skill, Certificacao
from typing import TYPE_CHECKING

from pydantic import EmailStr, Field

from app.schemas.base import CamelModel

if TYPE_CHECKING:
    from app.models.candidato import Candidato, Certificacao, Skill


class CandidatoCreate(CamelModel):
    """Cadastro público de candidato — cria User (role=candidato) + Candidato juntos."""

    email: EmailStr
    senha: str = Field(min_length=8)
    nome: str
    cargo: str
    nivel: str  # codigo de cd_niveis (ex: "junior") — validado no service, não aqui
    setor_atuacao: str
    localidade: str
    anos_experiencia: int = Field(ge=0)


class SkillRead(CamelModel):
    id: int
    nome: str
    categoria: str  # codigo de cd_categorias_skill

    @classmethod
    def from_model(cls, skill: "Skill") -> "SkillRead":
        return cls(id=skill.skill_id, nome=skill.nome, categoria=skill.categoria.codigo)


class CertificacaoRead(CamelModel):
    id: int
    nome: str
    validada: bool

    @classmethod
    def from_model(cls, cert: "Certificacao") -> "CertificacaoRead":
        return cls(id=cert.certificacao_id, nome=cert.nome, validada=cert.validada)


class CandidatoRead(CamelModel):
    """`nome`/`email` vêm de `candidato.usuario` (ver decisão 2 do
    ESTRUTURA-BANCO-DE-DADOS.md). `candidaturas` é lista de IDs de **vaga**
    (não de candidatura) — assim que o frontend já espera."""

    id: int
    nome: str
    email: str
    cargo: str
    nivel: str
    setor_atuacao: str
    localidade: str
    anos_experiencia: int
    avatar_url: str | None = None
    perfil_completo: int
    skills: list[SkillRead]
    certificacoes: list[CertificacaoRead]
    curriculo_url: str | None = None
    alertas_ativos: bool
    candidaturas: list[int]

    @classmethod
    def from_model(cls, candidato: "Candidato") -> "CandidatoRead":
        usuario = candidato.usuario
        return cls(
            id=candidato.candidato_id,
            nome=usuario.nome if usuario else "",
            email=usuario.email if usuario else "",
            cargo=candidato.cargo,
            nivel=candidato.nivel.nome,
            setor_atuacao=candidato.setor_atuacao,
            localidade=candidato.localidade,
            anos_experiencia=candidato.anos_experiencia,
            avatar_url=usuario.avatar_url if usuario else None,
            perfil_completo=candidato.perfil_completo,
            skills=[SkillRead.from_model(s) for s in candidato.skills],
            certificacoes=[CertificacaoRead.from_model(c) for c in candidato.certificacoes],
            curriculo_url=candidato.curriculo_url,
            alertas_ativos=candidato.alertas_ativos,
            candidaturas=[c.vaga_id for c in candidato.candidaturas],
        )


class CandidatoUpdate(CamelModel):
    """Todos os campos opcionais (PATCH parcial)."""

    cargo: str | None = None
    nivel: str | None = None  # codigo
    setor_atuacao: str | None = None
    localidade: str | None = None
    anos_experiencia: int | None = Field(default=None, ge=0)
    curriculo_url: str | None = None
    alertas_ativos: bool | None = None


class SkillCreate(CamelModel):
    nome: str
    categoria: str  # codigo de cd_categorias_skill
