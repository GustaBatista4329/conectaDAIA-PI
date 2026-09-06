# Regras: candidatar (idempotente, sem duplicar), mover_status, adicionar_parecer,
# listar_por_vaga/candidato — as que envolvem uma vaga exigem empresa_id (dona) pra checar posse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cadastros import StatusCandidatura
from app.models.candidatura import Candidatura
from app.models.vaga import Vaga
from app.schemas.candidatura import CandidaturaRead

_OPTIONS = (selectinload(Candidatura.status),)


async def _recarregar(db: AsyncSession, candidatura_id: int) -> CandidaturaRead:
    resultado = await db.execute(
        select(Candidatura).where(Candidatura.candidatura_id == candidatura_id).options(*_OPTIONS)
    )
    return CandidaturaRead.from_model(resultado.scalar_one())


async def _verificar_dono_da_vaga(db: AsyncSession, vaga_id: int, empresa_id: int) -> None:
    vaga = await db.get(Vaga, vaga_id)
    if vaga is None or vaga.empresa_id != empresa_id:
        raise PermissionError("Você não tem permissão para acessar candidaturas desta vaga")


async def listar_por_vaga(db: AsyncSession, empresa_id: int, vaga_id: int) -> list[CandidaturaRead]:
    await _verificar_dono_da_vaga(db, vaga_id, empresa_id)
    resultado = await db.execute(
        select(Candidatura).where(Candidatura.vaga_id == vaga_id).options(*_OPTIONS)
    )
    return [CandidaturaRead.from_model(c) for c in resultado.scalars().all()]


async def listar_por_candidato(db: AsyncSession, candidato_id: int) -> list[CandidaturaRead]:
    resultado = await db.execute(
        select(Candidatura).where(Candidatura.candidato_id == candidato_id).options(*_OPTIONS)
    )
    return [CandidaturaRead.from_model(c) for c in resultado.scalars().all()]


async def candidatar(db: AsyncSession, candidato_id: int, vaga_id: int) -> CandidaturaRead:
    """Idempotente: se já existe candidatura pra esse par, devolve ela em vez
    de dar erro (mesmo comportamento do mock original)."""
    existente = await db.execute(
        select(Candidatura)
        .where(Candidatura.candidato_id == candidato_id, Candidatura.vaga_id == vaga_id)
        .options(*_OPTIONS)
    )
    candidatura = existente.scalar_one_or_none()
    if candidatura is not None:
        return CandidaturaRead.from_model(candidatura)

    status_resultado = await db.execute(
        select(StatusCandidatura).where(StatusCandidatura.codigo == "triagem")
    )
    status_triagem = status_resultado.scalar_one()

    nova = Candidatura(candidato_id=candidato_id, vaga_id=vaga_id, status_id=status_triagem.status_id)
    db.add(nova)
    await db.commit()

    return await _recarregar(db, nova.candidatura_id)


async def mover_status(
    db: AsyncSession, empresa_id: int, candidatura_id: int, novo_status_codigo: str
) -> CandidaturaRead:
    candidatura = await db.get(Candidatura, candidatura_id)
    if candidatura is None:
        raise ValueError("Candidatura não encontrada")
    await _verificar_dono_da_vaga(db, candidatura.vaga_id, empresa_id)

    status_resultado = await db.execute(
        select(StatusCandidatura).where(StatusCandidatura.codigo == novo_status_codigo)
    )
    status = status_resultado.scalar_one_or_none()
    if status is None:
        raise ValueError(f"Status inválido: {novo_status_codigo}")

    candidatura.status_id = status.status_id
    await db.commit()
    return await _recarregar(db, candidatura_id)


async def adicionar_parecer(
    db: AsyncSession, empresa_id: int, candidatura_id: int, tipo: str, texto: str
) -> CandidaturaRead:
    candidatura = await db.get(Candidatura, candidatura_id)
    if candidatura is None:
        raise ValueError("Candidatura não encontrada")
    await _verificar_dono_da_vaga(db, candidatura.vaga_id, empresa_id)

    if tipo == "rh":
        candidatura.parecer_rh = texto
    else:
        candidatura.parecer_tecnico = texto
    await db.commit()
    return await _recarregar(db, candidatura_id)
