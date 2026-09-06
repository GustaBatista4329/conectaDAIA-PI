# Rotas: POST /empresas (cadastro), GET /empresas, PATCH /empresas/{id}/validar, PATCH /empresas/{id}/suspender
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import require_role
from app.schemas.empresa import EmpresaCreate, EmpresaRead
from app.schemas.user import TokenResponse, UserRead
from app.services import empresa_service

router = APIRouter(prefix="/empresas", tags=["empresas"])


@router.post("", response_model=TokenResponse, status_code=201)
async def cadastrar(body: EmpresaCreate, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    try:
        token, user = await empresa_service.registrar(db, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return TokenResponse(access_token=token, user=UserRead.from_model(user))


@router.get("", response_model=list[EmpresaRead], dependencies=[Depends(require_role("admin"))])
async def listar(db: AsyncSession = Depends(get_db)):
    return await empresa_service.listar(db)


@router.patch(
    "/{empresa_id}/validar",
    response_model=EmpresaRead,
    dependencies=[Depends(require_role("admin"))],
)
async def validar(empresa_id: int, db: AsyncSession = Depends(get_db)):
    try:
        return await empresa_service.validar(db, empresa_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch(
    "/{empresa_id}/suspender",
    response_model=EmpresaRead,
    dependencies=[Depends(require_role("admin"))],
)
async def suspender(empresa_id: int, db: AsyncSession = Depends(get_db)):
    try:
        return await empresa_service.suspender(db, empresa_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
