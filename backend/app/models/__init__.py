# Importar todo model aqui garante que ele se registra em Base.metadata assim
# que "app.models" (ou qualquer model individual, ex: app.models.user) for
# importado de qualquer lugar — Python sempre executa o __init__.py do pacote
# antes de um submódulo dele. É isso que o Alembic --autogenerate depende para
# enxergar todas as tabelas.
from app.models.cadastros import (
    CategoriaSkill,
    Nivel,
    StatusCandidatura,
    StatusDenuncia,
    StatusValidacaoEmpresa,
    TipoContrato,
    TipoDenuncia,
    TipoUsuario,
)
from app.models.admin import Denuncia, LogAuditoria
from app.models.candidato import Candidato, Certificacao, Skill
from app.models.candidatura import Candidatura
from app.models.empresa import Empresa
from app.models.user import User
from app.models.vaga import Vaga, VagaHabilidade

__all__ = [
    "CategoriaSkill",
    "Nivel",
    "StatusCandidatura",
    "StatusDenuncia",
    "StatusValidacaoEmpresa",
    "TipoContrato",
    "TipoDenuncia",
    "TipoUsuario",
    "Denuncia",
    "LogAuditoria",
    "Candidato",
    "Certificacao",
    "Skill",
    "Candidatura",
    "Empresa",
    "User",
    "Vaga",
    "VagaHabilidade",
]
