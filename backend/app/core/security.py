# Hash de senha (passlib) e criação/validação de JWT
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_ALGORITHM = "HS256"


def hash_senha(senha: str) -> str:
    return _pwd_context.hash(senha)


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return _pwd_context.verify(senha, senha_hash)


def criar_token(user_id: int, role: str) -> str:
    settings = get_settings()
    expira_em = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": str(user_id), "role": role, "exp": expira_em}
    return jwt.encode(payload, settings.secret_key, algorithm=JWT_ALGORITHM)


def decodificar_token(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[JWT_ALGORITHM])
    except JWTError as exc:
        raise ValueError("Token inválido ou expirado") from exc
