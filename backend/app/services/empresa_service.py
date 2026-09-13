# Regras: registrar, obter, atualizar, listar, validar, suspender (as duas
# últimas geram log de auditoria)
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import criar_token, hash_senha
from app.models.admin import LogAuditoria
from app.models.cadastros import StatusValidacaoEmpresa, TipoUsuario
from app.models.empresa import Empresa
from app.models.user import User
from app.models.vaga import Vaga
from app.schemas.empresa import EmpresaCreate, EmpresaRead, EmpresaUpdate

_OPTIONS = (selectinload(Empresa.status_validacao),)


async def registrar(db: AsyncSession, dados: EmpresaCreate) -> tuple[str, User]:
    email_existente = await db.execute(select(User).where(User.email == dados.email))
    if email_existente.scalar_one_or_none() is not None:
        raise ValueError("Email já cadastrado")

    cnpj_existente = await db.execute(select(Empresa).where(Empresa.cnpj == dados.cnpj))
    if cnpj_existente.scalar_one_or_none() is not None:
        raise ValueError("CNPJ já cadastrado")

    status_resultado = await db.execute(
        select(StatusValidacaoEmpresa).where(StatusValidacaoEmpresa.codigo == "em_analise")
    )
    status_em_analise = status_resultado.scalar_one()

    tipo_resultado = await db.execute(select(TipoUsuario).where(TipoUsuario.codigo == "empresa"))
    tipo_empresa = tipo_resultado.scalar_one()

    empresa = Empresa(
        nome=dados.nome,
        cnpj=dados.cnpj,
        setor=dados.setor,
        status_validacao_id=status_em_analise.status_validacao_id,
        sede=dados.sede,
        logo_inicial=dados.nome[:1].upper(),
    )
    db.add(empresa)
    await db.flush()  # gera empresa.empresa_id sem comitar ainda, pra usar como FK abaixo

    user = User(
        email=dados.email,
        senha_hash=hash_senha(dados.senha),
        nome=dados.nome,
        tipo_usuario_id=tipo_empresa.tipo_usuario_id,
        empresa_id=empresa.empresa_id,
    )
    db.add(user)
    await db.commit()

    resultado = await db.execute(
        select(User).where(User.user_id == user.user_id).options(selectinload(User.tipo_usuario))
    )
    user = resultado.scalar_one()

    token = criar_token(user.user_id, user.tipo_usuario.codigo)
    return token, user


async def _contar_vagas_ativas(db: AsyncSession, empresa_id: int) -> int:
    resultado = await db.execute(
        select(func.count())
        .select_from(Vaga)
        .where(Vaga.empresa_id == empresa_id, Vaga.ativa.is_(True))
    )
    return resultado.scalar_one()


async def obter(db: AsyncSession, empresa_id: int) -> EmpresaRead | None:
    resultado = await db.execute(
        select(Empresa).where(Empresa.empresa_id == empresa_id).options(*_OPTIONS)
    )
    empresa = resultado.scalar_one_or_none()
    if empresa is None:
        return None
    total = await _contar_vagas_ativas(db, empresa_id)
    return EmpresaRead.from_model(empresa, total_vagas_ativas=total)


async def atualizar(db: AsyncSession, empresa_id: int, dados: EmpresaUpdate) -> EmpresaRead:
    empresa = await db.get(Empresa, empresa_id)
    if empresa is None:
        raise ValueError("Empresa não encontrada")

    if dados.nome is not None:
        empresa.nome = dados.nome
        empresa.logo_inicial = dados.nome[:1].upper()

        # nome da empresa é também o nome de exibição da conta (User.nome é
        # setado a partir de EmpresaCreate.nome em registrar()) — mantém os
        # dois em sincronia.
        usuario_resultado = await db.execute(select(User).where(User.empresa_id == empresa_id))
        usuario = usuario_resultado.scalar_one_or_none()
        if usuario is not None:
            usuario.nome = dados.nome

    if dados.setor is not None:
        empresa.setor = dados.setor
    if dados.sede is not None:
        empresa.sede = dados.sede
    if dados.sobre_empresa is not None:
        empresa.sobre_empresa = dados.sobre_empresa

    await db.commit()

    total = await _contar_vagas_ativas(db, empresa_id)
    resultado = await db.execute(
        select(Empresa).where(Empresa.empresa_id == empresa_id).options(*_OPTIONS)
    )
    return EmpresaRead.from_model(resultado.scalar_one(), total_vagas_ativas=total)


async def listar(db: AsyncSession) -> list[EmpresaRead]:
    resultado = await db.execute(select(Empresa).options(*_OPTIONS))
    empresas = resultado.scalars().all()

    saida = []
    for empresa in empresas:
        total = await _contar_vagas_ativas(db, empresa.empresa_id)
        saida.append(EmpresaRead.from_model(empresa, total_vagas_ativas=total))
    return saida


async def _mudar_status(
    db: AsyncSession, empresa_id: int, novo_status_codigo: str, tipo_log: str, descricao_log: str
) -> EmpresaRead:
    empresa = await db.get(Empresa, empresa_id)
    if empresa is None:
        raise ValueError("Empresa não encontrada")

    status_resultado = await db.execute(
        select(StatusValidacaoEmpresa).where(StatusValidacaoEmpresa.codigo == novo_status_codigo)
    )
    status = status_resultado.scalar_one()
    empresa.status_validacao_id = status.status_validacao_id

    db.add(LogAuditoria(tipo=tipo_log, descricao=descricao_log, alvo_id=str(empresa_id)))
    await db.commit()

    resultado = await db.execute(
        select(Empresa).where(Empresa.empresa_id == empresa_id).options(*_OPTIONS)
    )
    empresa = resultado.scalar_one()
    total = await _contar_vagas_ativas(db, empresa_id)
    return EmpresaRead.from_model(empresa, total_vagas_ativas=total)


async def validar(db: AsyncSession, empresa_id: int) -> EmpresaRead:
    return await _mudar_status(
        db, empresa_id, "validada", "EMPRESA_APROVADA", f"Empresa {empresa_id} validada manualmente"
    )


async def suspender(db: AsyncSession, empresa_id: int) -> EmpresaRead:
    return await _mudar_status(
        db, empresa_id, "suspensa", "EMPRESA_SUSPENSA", f"Empresa {empresa_id} suspensa"
    )
