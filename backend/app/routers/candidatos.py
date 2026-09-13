# Rotas: POST /candidatos (cadastro), GET/PATCH /candidatos/{id},
# POST/DELETE skills, POST/DELETE formacoes, POST/DELETE experiencias
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import get_current_user, require_role
from app.models.user import User
from app.schemas.candidato import (
    CandidatoCreate,
    CandidatoRead,
    CandidatoUpdate,
    ExperienciaCreate,
    FormacaoCreate,
    SkillCreate,
)
from app.schemas.user import TokenResponse, UserRead
from app.services import candidato_service

router = APIRouter(prefix="/candidatos", tags=["candidatos"])


def _garantir_dono(current_user: User, candidato_id: int) -> None:
    if current_user.candidato_id != candidato_id:
        raise HTTPException(status_code=403, detail="Você só pode alterar o próprio perfil")


@router.post("", response_model=TokenResponse, status_code=201)
async def cadastrar(body: CandidatoCreate, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    try:
        token, user = await candidato_service.registrar(db, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return TokenResponse(access_token=token, user=UserRead.from_model(user))


@router.get("/{candidato_id}", response_model=CandidatoRead)
async def obter(
    candidato_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    candidato = await candidato_service.obter(db, candidato_id)
    if candidato is None:
        raise HTTPException(status_code=404, detail="Candidato não encontrado")
    return candidato


@router.patch("/{candidato_id}", response_model=CandidatoRead)
async def atualizar(
    candidato_id: int,
    body: CandidatoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("candidato")),
):
    _garantir_dono(current_user, candidato_id)
    try:
        return await candidato_service.atualizar(db, candidato_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{candidato_id}/skills", response_model=CandidatoRead, status_code=201)
async def adicionar_skill(
    candidato_id: int,
    body: SkillCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("candidato")),
):
    _garantir_dono(current_user, candidato_id)
    try:
        return await candidato_service.adicionar_skill(db, candidato_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{candidato_id}/skills/{skill_id}", response_model=CandidatoRead)
async def remover_skill(
    candidato_id: int,
    skill_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("candidato")),
):
    _garantir_dono(current_user, candidato_id)
    try:
        return await candidato_service.remover_skill(db, candidato_id, skill_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{candidato_id}/formacoes", response_model=CandidatoRead, status_code=201)
async def adicionar_formacao(
    candidato_id: int,
    body: FormacaoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("candidato")),
):
    _garantir_dono(current_user, candidato_id)
    try:
        return await candidato_service.adicionar_formacao(db, candidato_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{candidato_id}/formacoes/{formacao_id}", response_model=CandidatoRead)
async def remover_formacao(
    candidato_id: int,
    formacao_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("candidato")),
):
    _garantir_dono(current_user, candidato_id)
    try:
        return await candidato_service.remover_formacao(db, candidato_id, formacao_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{candidato_id}/experiencias", response_model=CandidatoRead, status_code=201)
async def adicionar_experiencia(
    candidato_id: int,
    body: ExperienciaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("candidato")),
):
    _garantir_dono(current_user, candidato_id)
    try:
        return await candidato_service.adicionar_experiencia(db, candidato_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{candidato_id}/experiencias/{experiencia_id}", response_model=CandidatoRead)
async def remover_experiencia(
    candidato_id: int,
    experiencia_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("candidato")),
):
    _garantir_dono(current_user, candidato_id)
    try:
        return await candidato_service.remover_experiencia(db, candidato_id, experiencia_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
