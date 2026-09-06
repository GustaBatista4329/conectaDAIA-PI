# Rotas: POST /auth/login, GET /auth/me
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.user import LoginRequest, TokenResponse, UserRead
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    resultado = await auth_service.autenticar(db, body.email, body.senha)
    if resultado is None:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    token, user = resultado
    return TokenResponse(access_token=token, user=UserRead.from_model(user))


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.from_model(current_user)
