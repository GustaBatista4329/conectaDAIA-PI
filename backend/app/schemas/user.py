# Schemas Pydantic de User/Auth — contrato da API, não a tabela.
from typing import TYPE_CHECKING, Literal

from pydantic import Field

from app.schemas.base import CamelModel

if TYPE_CHECKING:
    from app.models.user import User


class UserRead(CamelModel):
    """Formato de resposta da API para um usuário. NUNCA inclui senha/hash."""

    id: int
    email: str
    nome: str
    role: Literal["candidato", "empresa", "admin"]
    avatar_url: str | None = None
    candidato_id: int | None = None
    empresa_id: int | None = None

    @classmethod
    def from_model(cls, user: "User") -> "UserRead":
        """Monta o schema a partir do model — explícito porque `id` (vem de
        `user_id`) e `role` (vem de `user.tipo_usuario.codigo`) não são cópia
        direta de atributo (ver docs/ESTRUTURA-BANCO-DE-DADOS.md e a discussão
        sobre Enum vs cadastro em docs/APRENDIZADO-BACKEND.md)."""
        return cls(
            id=user.user_id,
            email=user.email,
            nome=user.nome,
            role=user.tipo_usuario.codigo,
            avatar_url=user.avatar_url,
            candidato_id=user.candidato_id,
            empresa_id=user.empresa_id,
        )


class LoginRequest(CamelModel):
    """Corpo esperado em POST /auth/login."""

    email: str
    senha: str


class TokenResponse(CamelModel):
    """Resposta de POST /auth/login: o JWT + os dados do usuário logado."""

    access_token: str
    token_type: str = "bearer"
    user: UserRead


class UserUpdate(CamelModel):
    """Ainda não usado por nenhuma rota — preparado para o futuro. Todos os
    campos opcionais (PATCH parcial: só manda o que quer mudar). Não inclui
    `email` nem `role` — trocar e-mail de login e mudar tipo de conta não são
    edições simples de perfil, mereceriam fluxo/validação própria depois."""

    nome: str | None = None
    avatar_url: str | None = None
    senha: str | None = Field(default=None, min_length=8)
