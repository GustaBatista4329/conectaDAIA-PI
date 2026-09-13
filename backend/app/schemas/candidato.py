# Schemas de Candidato, Skill, Certificacao, Formacao, Experiencia
from datetime import date
from typing import TYPE_CHECKING

from pydantic import EmailStr, Field, model_validator

from app.models.enums import AreaEstudo, LocalTrabalho, TipoTrabalho
from app.schemas.base import CamelModel

if TYPE_CHECKING:
    from app.models.candidato import Candidato, Certificacao, Experiencia, Formacao, Skill


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


class FormacaoRead(CamelModel):
    id: int
    instituicao: str
    curso: str
    area_estudo: AreaEstudo
    data_inicio: date
    data_formatura: date  # pode ser futura — formação ainda em andamento

    @classmethod
    def from_model(cls, formacao: "Formacao") -> "FormacaoRead":
        return cls(
            id=formacao.formacao_id,
            instituicao=formacao.instituicao,
            curso=formacao.curso,
            area_estudo=formacao.area_estudo,
            data_inicio=formacao.data_inicio,
            data_formatura=formacao.data_formatura,
        )


class FormacaoCreate(CamelModel):
    instituicao: str = Field(min_length=1)
    curso: str = Field(min_length=1)
    area_estudo: AreaEstudo
    data_inicio: date
    data_formatura: date  # pode ser futura — formação ainda em andamento

    @model_validator(mode="after")
    def _validar_datas(self) -> "FormacaoCreate":
        if self.data_formatura < self.data_inicio:
            raise ValueError("Data de formatura não pode ser anterior à data de início")
        return self


class ExperienciaRead(CamelModel):
    id: int
    empresa_nome: str
    cargo: str
    tipo_trabalho: TipoTrabalho
    local_trabalho: LocalTrabalho
    data_inicio: date
    data_fim: date | None = None  # None quando trabalhando_atualmente=True
    trabalhando_atualmente: bool

    @classmethod
    def from_model(cls, experiencia: "Experiencia") -> "ExperienciaRead":
        return cls(
            id=experiencia.experiencia_id,
            empresa_nome=experiencia.empresa_nome,
            cargo=experiencia.cargo,
            tipo_trabalho=experiencia.tipo_trabalho,
            local_trabalho=experiencia.local_trabalho,
            data_inicio=experiencia.data_inicio,
            data_fim=experiencia.data_fim,
            trabalhando_atualmente=experiencia.trabalhando_atualmente,
        )


class ExperienciaCreate(CamelModel):
    empresa_nome: str = Field(min_length=1)
    cargo: str = Field(min_length=1)
    tipo_trabalho: TipoTrabalho
    local_trabalho: LocalTrabalho
    data_inicio: date
    data_fim: date | None = None
    trabalhando_atualmente: bool = False

    @model_validator(mode="after")
    def _validar_datas(self) -> "ExperienciaCreate":
        if self.trabalhando_atualmente:
            if self.data_fim is not None:
                raise ValueError(
                    "Não informe data de saída para quem ainda está trabalhando lá"
                )
        else:
            if self.data_fim is None:
                raise ValueError(
                    "Data de saída é obrigatória quando não está mais trabalhando lá"
                )
            if self.data_fim < self.data_inicio:
                raise ValueError("Data de saída não pode ser anterior à data de início")
        return self


class CandidatoRead(CamelModel):
    """`nome`/`email` vêm de `candidato.usuario` (ver decisão 2 do
    docs/ESTRUTURA-BANCO-DE-DADOS.md). `candidaturas` é lista de IDs de **vaga**
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
    sobre_mim: str | None = None
    skills: list[SkillRead]
    certificacoes: list[CertificacaoRead]
    formacoes: list[FormacaoRead]
    experiencias: list[ExperienciaRead]
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
            sobre_mim=candidato.sobre_mim,
            skills=[SkillRead.from_model(s) for s in candidato.skills],
            certificacoes=[CertificacaoRead.from_model(c) for c in candidato.certificacoes],
            formacoes=[FormacaoRead.from_model(f) for f in candidato.formacoes],
            experiencias=[ExperienciaRead.from_model(e) for e in candidato.experiencias],
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
    sobre_mim: str | None = Field(default=None, max_length=2000)
    curriculo_url: str | None = None
    alertas_ativos: bool | None = None


class SkillCreate(CamelModel):
    nome: str
    categoria: str  # codigo de cd_categorias_skill
