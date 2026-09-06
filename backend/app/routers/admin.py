# Rotas: GET /admin/metricas, /admin/denuncias, PATCH resolver, GET /admin/logs, POST /admin/seed-demo
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import require_role
from app.schemas.admin import (
    DenunciaRead,
    LogAuditoriaRead,
    MetricasRead,
    ResolverDenunciaRequest,
    SeedDemoResponse,
)
from app.services import admin_service

# Guard aplicado no router inteiro — toda rota aqui exige admin, não precisa repetir por rota.
router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_role("admin"))])


@router.get("/metricas", response_model=MetricasRead)
async def metricas(db: AsyncSession = Depends(get_db)):
    return await admin_service.metricas(db)


@router.get("/denuncias", response_model=list[DenunciaRead])
async def listar_denuncias(db: AsyncSession = Depends(get_db)):
    return await admin_service.listar_denuncias(db)


@router.patch("/denuncias/{denuncia_id}/resolver", response_model=DenunciaRead)
async def resolver_denuncia(
    denuncia_id: int, body: ResolverDenunciaRequest, db: AsyncSession = Depends(get_db)
):
    try:
        return await admin_service.resolver_denuncia(db, denuncia_id, body.acao)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/logs", response_model=list[LogAuditoriaRead])
async def logs_auditoria(db: AsyncSession = Depends(get_db)):
    return await admin_service.logs_auditoria(db)


@router.post("/seed-demo", response_model=SeedDemoResponse)
async def seed_demo(db: AsyncSession = Depends(get_db)):
    criados = await admin_service.seed_demo(db)
    return SeedDemoResponse(**criados)
