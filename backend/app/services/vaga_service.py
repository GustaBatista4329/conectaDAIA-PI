# Regras: listar (com filtros), obter, criar, desativar
# RNE-001 (documento do projeto): só a empresa dona pode alterar a própria vaga.
import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cadastros import Nivel, TipoContrato
from app.models.candidatura import Candidatura
from app.models.empresa import Empresa
from app.models.vaga import Vaga, VagaHabilidade
from app.schemas.vaga import VagaCreate, VagaFiltros, VagaRead

_OPTIONS = (
    selectinload(Vaga.empresa),
    selectinload(Vaga.nivel),
    selectinload(Vaga.tipo_contrato),
    selectinload(Vaga.habilidades),
)


async def _contar_candidatos(db: AsyncSession, vaga_id: int) -> int:
    resultado = await db.execute(
        select(func.count()).select_from(Candidatura).where(Candidatura.vaga_id == vaga_id)
    )
    return resultado.scalar_one()


async def listar(db: AsyncSession, filtros: VagaFiltros) -> list[VagaRead]:
    query = select(Vaga).options(*_OPTIONS)

    if filtros.apenas_ativas:
        query = query.where(Vaga.ativa.is_(True))
    if filtros.empresa_id is not None:
        query = query.where(Vaga.empresa_id == filtros.empresa_id)
    if filtros.termo:
        termo_like = f"%{filtros.termo}%"
        query = query.where(
            or_(
                Vaga.titulo.ilike(termo_like),
                Vaga.empresa.has(Empresa.nome.ilike(termo_like)),
                Vaga.habilidades.any(VagaHabilidade.nome.ilike(termo_like)),
            )
        )
    if filtros.setor:
        query = query.where(Vaga.setor_atuacao == filtros.setor)
    if filtros.distrito:
        query = query.where(Vaga.distrito == filtros.distrito)
    if filtros.nivel:
        query = query.where(Vaga.nivel.has(Nivel.codigo == filtros.nivel))
    if filtros.salario_min is not None:
        query = query.where(Vaga.salario_max >= filtros.salario_min)
    if filtros.salario_max is not None:
        query = query.where(Vaga.salario_min <= filtros.salario_max)

    resultado = await db.execute(query)
    vagas = resultado.scalars().all()

    saida = []
    for vaga in vagas:
        total = await _contar_candidatos(db, vaga.vaga_id)
        saida.append(VagaRead.from_model(vaga, total_candidatos=total))
    return saida


async def obter(db: AsyncSession, vaga_id: int) -> VagaRead | None:
    resultado = await db.execute(select(Vaga).where(Vaga.vaga_id == vaga_id).options(*_OPTIONS))
    vaga = resultado.scalar_one_or_none()
    if vaga is None:
        return None

    total = await _contar_candidatos(db, vaga.vaga_id)
    return VagaRead.from_model(vaga, total_candidatos=total)


async def criar(db: AsyncSession, empresa_id: int, dados: VagaCreate) -> VagaRead:
    nivel_resultado = await db.execute(select(Nivel).where(Nivel.codigo == dados.nivel))
    nivel = nivel_resultado.scalar_one_or_none()
    if nivel is None:
        raise ValueError(f"Nível inválido: {dados.nivel}")

    tipo_resultado = await db.execute(
        select(TipoContrato).where(TipoContrato.codigo == dados.tipo_contrato)
    )
    tipo_contrato = tipo_resultado.scalar_one_or_none()
    if tipo_contrato is None:
        raise ValueError(f"Tipo de contrato inválido: {dados.tipo_contrato}")

    vaga = Vaga(
        codigo=uuid.uuid4().hex[:10],
        titulo=dados.titulo,
        empresa_id=empresa_id,
        setor_atuacao=dados.setor_atuacao,
        distrito=dados.distrito,
        nivel_id=nivel.nivel_id,
        salario_min=dados.salario_min,
        salario_max=dados.salario_max,
        tipo_contrato_id=tipo_contrato.tipo_contrato_id,
        descricao=dados.descricao,
    )
    db.add(vaga)
    await db.flush()  # gera vaga.vaga_id, pra usar como FK das habilidades abaixo

    for nome_habilidade in dados.habilidades_requeridas:
        db.add(VagaHabilidade(vaga_id=vaga.vaga_id, nome=nome_habilidade))

    await db.commit()

    resultado = await db.execute(select(Vaga).where(Vaga.vaga_id == vaga.vaga_id).options(*_OPTIONS))
    vaga = resultado.scalar_one()
    return VagaRead.from_model(vaga, total_candidatos=0)


async def desativar(db: AsyncSession, empresa_id: int, vaga_id: int) -> VagaRead:
    vaga_obj = await db.get(Vaga, vaga_id)
    if vaga_obj is None:
        raise ValueError("Vaga não encontrada")
    if vaga_obj.empresa_id != empresa_id:
        raise PermissionError("Você não tem permissão para alterar esta vaga")

    vaga_obj.ativa = False
    await db.commit()

    resultado = await db.execute(select(Vaga).where(Vaga.vaga_id == vaga_id).options(*_OPTIONS))
    vaga_obj = resultado.scalar_one()
    total = await _contar_candidatos(db, vaga_id)
    return VagaRead.from_model(vaga_obj, total_candidatos=total)
