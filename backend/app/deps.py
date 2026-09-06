# Dependencies compartilhadas: get_current_user, guards de role (get_db mora
# em app/db/session.py, importado aqui só por conveniência de quem usa deps)
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import decodificar_token
from app.db.session import get_db
from app.models.user import User

# tokenUrl só serve pra documentação do Swagger (botão "Authorize") — nosso
# login de verdade recebe JSON, não o form padrão do OAuth2; usamos essa
# classe só pela capacidade dela de extrair o header "Authorization: Bearer ..."
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credenciais_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decodificar_token(token)
    except ValueError as exc:
        raise credenciais_invalidas from exc

    user_id = payload.get("sub")
    if user_id is None:
        raise credenciais_invalidas

    resultado = await db.execute(
        select(User).where(User.user_id == int(user_id)).options(selectinload(User.tipo_usuario))
    )
    user = resultado.scalar_one_or_none()
    if user is None:
        raise credenciais_invalidas

    return user


def require_role(*roles: str):
    """Guard reaproveitável: Depends(require_role("admin")),
    Depends(require_role("candidato", "empresa")), etc."""

    async def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.tipo_usuario.codigo not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar este recurso",
            )
        return current_user

    return checker
