# Regra: autenticar(email, senha) -> (token, User) | None
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import criar_token, verificar_senha
from app.models.user import User


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
