# Rotas: POST /empresas (cadastro), GET /empresas, GET/PATCH /empresas/{id},
# PATCH /empresas/{id}/validar, PATCH /empresas/{id}/suspender
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import get_current_user, require_role
from app.models.user import User
from app.schemas.empresa import EmpresaCreate, EmpresaRead, EmpresaUpdate
from app.schemas.user import TokenResponse, UserRead
from app.services import empresa_service

router = APIRouter(prefix="/empresas", tags=["empresas"])


def _garantir_dono(current_user: User, empresa_id: int) -> None:
    if current_user.empresa_id != empresa_id:
        raise HTTPException(status_code=403, detail="Você só pode alterar a própria empresa")


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


@router.get("/{empresa_id}", response_model=EmpresaRead)
async def obter(
    empresa_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    empresa = await empresa_service.obter(db, empresa_id)
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return empresa


@router.patch("/{empresa_id}", response_model=EmpresaRead)
async def atualizar(
    empresa_id: int,
    body: EmpresaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("empresa")),
):
    _garantir_dono(current_user, empresa_id)
    try:
        return await empresa_service.atualizar(db, empresa_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


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
