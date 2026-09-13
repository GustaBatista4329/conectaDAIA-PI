# Regras: autenticar(email, senha) -> (token, User) | None; atualizar_perfil
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import criar_token, verificar_senha
from app.models.user import User
from app.schemas.user import UserUpdate


async def autenticar(db: AsyncSession, email: str, senha: str) -> tuple[str, User] | None:
    resultado = await db.execute(
        select(User)
        .where(User.email == email)
        .options(selectinload(User.tipo_usuario))
    )
    user = resultado.scalar_one_or_none()

    if user is None:
        return None
    if not verificar_senha(senha, user.senha_hash):
        return None

    token = criar_token(user.user_id, user.tipo_usuario.codigo)
    return token, user


async def atualizar_perfil(db: AsyncSession, user: User, dados: UserUpdate) -> User:
    """PATCH parcial dos dados de identidade do usuário logado (ex: nome).

    `avatar_url`/`senha` do UserUpdate não são tratados aqui de propósito —
    ver docstring de UserUpdate em app/schemas/user.py."""
    if dados.nome is not None:
        user.nome = dados.nome

    await db.commit()
    return user
