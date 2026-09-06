# Rotas: GET por vaga/candidato, POST candidatar, PATCH status, PATCH parecer
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import require_role
from app.models.user import User
from app.schemas.candidatura import CandidaturaCreate, CandidaturaRead, ParecerUpdate, StatusUpdate
from app.services import candidatura_service

router = APIRouter(prefix="/candidaturas", tags=["candidaturas"])


@router.get("/vaga/{vaga_id}", response_model=list[CandidaturaRead])
async def listar_por_vaga(
    vaga_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("empresa")),
):
    try:
        return await candidatura_service.listar_por_vaga(db, current_user.empresa_id, vaga_id)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.get("/candidato/{candidato_id}", response_model=list[CandidaturaRead])
async def listar_por_candidato(
    candidato_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("candidato")),
):
    if current_user.candidato_id != candidato_id:
        raise HTTPException(status_code=403, detail="Você só pode ver as próprias candidaturas")
    return await candidatura_service.listar_por_candidato(db, candidato_id)


@router.post("", response_model=CandidaturaRead, status_code=201)
async def candidatar(
    body: CandidaturaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("candidato")),
):
    return await candidatura_service.candidatar(db, current_user.candidato_id, body.vaga_id)


@router.patch("/{candidatura_id}/status", response_model=CandidaturaRead)
async def mover_status(
    candidatura_id: int,
    body: StatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("empresa")),
):
    try:
        return await candidatura_service.mover_status(
            db, current_user.empresa_id, candidatura_id, body.status
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.patch("/{candidatura_id}/parecer", response_model=CandidaturaRead)
async def adicionar_parecer(
    candidatura_id: int,
    body: ParecerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("empresa")),
):
    try:
        return await candidatura_service.adicionar_parecer(
            db, current_user.empresa_id, candidatura_id, body.tipo, body.texto
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
