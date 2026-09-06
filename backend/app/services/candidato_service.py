# Regras: registrar, obter, atualizar, adicionar_skill, remover_skill
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import criar_token, hash_senha
from app.models.cadastros import CategoriaSkill, Nivel, TipoUsuario
from app.models.candidato import Candidato, Skill
from app.models.user import User
from app.schemas.candidato import CandidatoCreate, CandidatoRead, CandidatoUpdate, SkillCreate

_OPTIONS = (
    selectinload(Candidato.usuario),
    selectinload(Candidato.nivel),
    selectinload(Candidato.skills).selectinload(Skill.categoria),
    selectinload(Candidato.certificacoes),
    selectinload(Candidato.candidaturas),
)


async def registrar(db: AsyncSession, dados: CandidatoCreate) -> tuple[str, User]:
    email_existente = await db.execute(select(User).where(User.email == dados.email))
    if email_existente.scalar_one_or_none() is not None:
        raise ValueError("Email já cadastrado")

    nivel_resultado = await db.execute(
        select(Nivel).where(Nivel.codigo == dados.nivel, Nivel.ativo.is_(True))
    )
    nivel = nivel_resultado.scalar_one_or_none()
    if nivel is None:
        raise ValueError(f"Nível inválido: {dados.nivel}")

    tipo_resultado = await db.execute(select(TipoUsuario).where(TipoUsuario.codigo == "candidato"))
    tipo_candidato = tipo_resultado.scalar_one()

    candidato = Candidato(
        cargo=dados.cargo,
        nivel_id=nivel.nivel_id,
        setor_atuacao=dados.setor_atuacao,
        localidade=dados.localidade,
        anos_experiencia=dados.anos_experiencia,
    )
    db.add(candidato)
    await db.flush()  # gera candidato.candidato_id sem comitar ainda, pra usar como FK abaixo

    user = User(
        email=dados.email,
        senha_hash=hash_senha(dados.senha),
        nome=dados.nome,
        tipo_usuario_id=tipo_candidato.tipo_usuario_id,
        candidato_id=candidato.candidato_id,
    )
    db.add(user)
    await db.commit()

    resultado = await db.execute(
        select(User).where(User.user_id == user.user_id).options(selectinload(User.tipo_usuario))
    )
    user = resultado.scalar_one()

    token = criar_token(user.user_id, user.tipo_usuario.codigo)
    return token, user


async def _recarregar(db: AsyncSession, candidato_id: int) -> CandidatoRead:
    resultado = await db.execute(
        select(Candidato).where(Candidato.candidato_id == candidato_id).options(*_OPTIONS)
    )
    return CandidatoRead.from_model(resultado.scalar_one())


async def obter(db: AsyncSession, candidato_id: int) -> CandidatoRead | None:
    resultado = await db.execute(
        select(Candidato).where(Candidato.candidato_id == candidato_id).options(*_OPTIONS)
    )
    candidato = resultado.scalar_one_or_none()
    if candidato is None:
        return None
    return CandidatoRead.from_model(candidato)


async def atualizar(db: AsyncSession, candidato_id: int, dados: CandidatoUpdate) -> CandidatoRead:
    candidato = await db.get(Candidato, candidato_id)
    if candidato is None:
        raise ValueError("Candidato não encontrado")

    if dados.nivel is not None:
        nivel_resultado = await db.execute(select(Nivel).where(Nivel.codigo == dados.nivel))
        nivel = nivel_resultado.scalar_one_or_none()
        if nivel is None:
            raise ValueError(f"Nível inválido: {dados.nivel}")
        candidato.nivel_id = nivel.nivel_id

    campos_simples = (
        "cargo",
        "setor_atuacao",
        "localidade",
        "anos_experiencia",
        "curriculo_url",
        "alertas_ativos",
    )
    for campo in campos_simples:
        valor = getattr(dados, campo)
        if valor is not None:
            setattr(candidato, campo, valor)

    await db.commit()
    return await _recarregar(db, candidato_id)


async def adicionar_skill(db: AsyncSession, candidato_id: int, dados: SkillCreate) -> CandidatoRead:
    candidato = await db.get(Candidato, candidato_id)
    if candidato is None:
        raise ValueError("Candidato não encontrado")

    categoria_resultado = await db.execute(
        select(CategoriaSkill).where(CategoriaSkill.codigo == dados.categoria)
    )
    categoria = categoria_resultado.scalar_one_or_none()
    if categoria is None:
        raise ValueError(f"Categoria inválida: {dados.categoria}")

    ja_existe = await db.execute(
        select(Skill).where(Skill.candidato_id == candidato_id, Skill.nome.ilike(dados.nome))
    )
    if ja_existe.scalar_one_or_none() is None:
        db.add(
            Skill(
                candidato_id=candidato_id,
                nome=dados.nome,
                categoria_skill_id=categoria.categoria_skill_id,
            )
        )
        candidato.perfil_completo = min(100, candidato.perfil_completo + 2)
        await db.commit()

    return await _recarregar(db, candidato_id)


async def remover_skill(db: AsyncSession, candidato_id: int, skill_id: int) -> CandidatoRead:
    skill = await db.get(Skill, skill_id)
    if skill is None or skill.candidato_id != candidato_id:
        raise ValueError("Skill não encontrada")

    await db.delete(skill)
    await db.commit()
    return await _recarregar(db, candidato_id)
