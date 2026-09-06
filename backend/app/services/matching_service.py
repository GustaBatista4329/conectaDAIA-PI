# Regra: calcular_match(candidato, vaga) -> percentual (RNE-003 do documento)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.candidato import Candidato
from app.models.vaga import Vaga


async def calcular_match(db: AsyncSession, candidato_id: int, vaga_id: int) -> int:
    candidato_resultado = await db.execute(
        select(Candidato)
        .where(Candidato.candidato_id == candidato_id)
        .options(selectinload(Candidato.skills))
    )
    candidato = candidato_resultado.scalar_one_or_none()

    vaga_resultado = await db.execute(
        select(Vaga).where(Vaga.vaga_id == vaga_id).options(selectinload(Vaga.habilidades))
    )
    vaga = vaga_resultado.scalar_one_or_none()

    if candidato is None or vaga is None:
        return 0

    skills_nomes = [s.nome.lower() for s in candidato.skills]
    habilidades = [h.nome for h in vaga.habilidades]

    encontrados = sum(
        1 for h in habilidades if any(h.lower() in s or s in h.lower() for s in skills_nomes)
    )
    base = round((encontrados / max(len(habilidades), 1)) * 100)
    bonus = 15 if candidato.perfil_completo > 80 else 0
    return min(100, base + bonus)
