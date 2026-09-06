# Rotas: GET /vagas, GET /vagas/{id}, POST /vagas, PATCH /vagas/{id}/desativar
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import require_role
from app.models.user import User
from app.schemas.vaga import MatchResponse, VagaCreate, VagaFiltros, VagaRead
from app.services import matching_service, vaga_service

router = APIRouter(prefix="/vagas", tags=["vagas"])


@router.get("", response_model=list[VagaRead])
async def listar(filtros: VagaFiltros = Depends(), db: AsyncSession = Depends(get_db)):
    return await vaga_service.listar(db, filtros)


@router.get("/{vaga_id}", response_model=VagaRead)
async def obter(vaga_id: int, db: AsyncSession = Depends(get_db)):
    vaga = await vaga_service.obter(db, vaga_id)
    if vaga is None:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
    return vaga


@router.get("/{vaga_id}/match", response_model=MatchResponse)
async def calcular_match(
    vaga_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("candidato")),
):
    percentual = await matching_service.calcular_match(db, current_user.candidato_id, vaga_id)
    return MatchResponse(match_percentual=percentual)


@router.post("", response_model=VagaRead, status_code=201)
async def criar(
    body: VagaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("empresa")),
):
    try:
        return await vaga_service.criar(db, current_user.empresa_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/{vaga_id}/desativar", response_model=VagaRead)
async def desativar(
    vaga_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("empresa")),
):
    try:
        return await vaga_service.desativar(db, current_user.empresa_id, vaga_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
