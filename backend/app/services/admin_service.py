# Regras: metricas (tudo calculado por query), listar_denuncias, resolver_denuncia,
# logs_auditoria, seed_demo (popula dados ficticios — idempotente por item)
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import hash_senha
from app.models.admin import Denuncia, LogAuditoria
from app.models.cadastros import (
    CategoriaSkill,
    Nivel,
    StatusCandidatura,
    StatusDenuncia,
    StatusValidacaoEmpresa,
    TipoContrato,
    TipoDenuncia,
    TipoUsuario,
)
from app.models.candidato import Candidato, Skill
from app.models.candidatura import Candidatura
from app.models.empresa import Empresa
from app.models.user import User
from app.models.vaga import Vaga, VagaHabilidade
from app.schemas.admin import DenunciaRead, LogAuditoriaRead, MetricasRead

_DENUNCIA_OPTIONS = (selectinload(Denuncia.tipo), selectinload(Denuncia.status))

_ACAO_PARA_STATUS = {
    "investigar": "em_investigacao",
    "ignorar": "ignorada",
    "suspender": "resolvida",
}


async def metricas(db: AsyncSession) -> MetricasRead:
    vagas_ativas = (
        await db.execute(select(func.count()).select_from(Vaga).where(Vaga.ativa.is_(True)))
    ).scalar_one()

    # criado_em é TIMESTAMP WITHOUT TIME ZONE no banco — comparar com um
    # datetime "naive" (sem tzinfo), senão o driver rejeita a comparação.
    trinta_dias_atras = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=30)
    novos_candidatos = (
        await db.execute(
            select(func.count())
            .select_from(User)
            .where(
                User.tipo_usuario.has(TipoUsuario.codigo == "candidato"),
                User.criado_em >= trinta_dias_atras,
            )
        )
    ).scalar_one()

    empresas_validadas = (
        await db.execute(
            select(func.count())
            .select_from(Empresa)
            .where(Empresa.status_validacao.has(StatusValidacaoEmpresa.codigo == "validada"))
        )
    ).scalar_one()

    # Aproximação: dias entre aplicação e entrevista, só para candidaturas já
    # "contratado" (não existe campo separado de data de contratação ainda).
    tempo_medio = (
        await db.execute(
            select(
                func.avg(
                    func.extract("epoch", Candidatura.data_entrevista - Candidatura.data_aplicacao)
                    / 86400.0
                )
            ).where(
                Candidatura.status.has(StatusCandidatura.codigo == "contratado"),
                Candidatura.data_entrevista.is_not(None),
            )
        )
    ).scalar_one()

    denuncias_pendentes = (
        await db.execute(
            select(func.count())
            .select_from(Denuncia)
            .where(Denuncia.status.has(StatusDenuncia.codigo == "pendente"))
        )
    ).scalar_one()

    return MetricasRead(
        vagas_ativas=vagas_ativas,
        novos_candidatos=novos_candidatos,
        empresas_validadas=empresas_validadas,
        tempo_medio_contratacao=round(float(tempo_medio), 1) if tempo_medio is not None else 0.0,
        denuncias_pendentes=denuncias_pendentes,
    )


async def listar_denuncias(db: AsyncSession) -> list[DenunciaRead]:
    resultado = await db.execute(select(Denuncia).options(*_DENUNCIA_OPTIONS))
    return [DenunciaRead.from_model(d) for d in resultado.scalars().all()]


async def resolver_denuncia(db: AsyncSession, denuncia_id: int, acao: str) -> DenunciaRead:
    denuncia = await db.get(Denuncia, denuncia_id)
    if denuncia is None:
        raise ValueError("Denúncia não encontrada")

    codigo_status = _ACAO_PARA_STATUS[acao]
    status_resultado = await db.execute(
        select(StatusDenuncia).where(StatusDenuncia.codigo == codigo_status)
    )
    status = status_resultado.scalar_one()
    denuncia.status_id = status.status_id
    await db.commit()

    resultado = await db.execute(
        select(Denuncia).where(Denuncia.denuncia_id == denuncia_id).options(*_DENUNCIA_OPTIONS)
    )
    return DenunciaRead.from_model(resultado.scalar_one())


async def logs_auditoria(db: AsyncSession, limite: int = 20) -> list[LogAuditoriaRead]:
    resultado = await db.execute(
        select(LogAuditoria).order_by(LogAuditoria.criado_em.desc()).limit(limite)
    )
    return [LogAuditoriaRead.from_model(log) for log in resultado.scalars().all()]


async def seed_demo(db: AsyncSession) -> dict[str, int]:
    """Popula dados fictícios pro sistema não ficar vazio pra quem for
    demonstrar/testar. Idempotente item a item (checado por email/cnpj/código)
    — clicar de novo não duplica, só completa o que ainda não existir."""
    criados = {"candidatos": 0, "empresas": 0, "vagas": 0, "candidaturas": 0, "denuncias": 0}

    tipos = {t.codigo: t for t in (await db.execute(select(TipoUsuario))).scalars().all()}
    niveis = {n.codigo: n for n in (await db.execute(select(Nivel))).scalars().all()}
    categorias = {c.codigo: c for c in (await db.execute(select(CategoriaSkill))).scalars().all()}
    status_emp = {s.codigo: s for s in (await db.execute(select(StatusValidacaoEmpresa))).scalars().all()}
    tipos_contrato = {t.codigo: t for t in (await db.execute(select(TipoContrato))).scalars().all()}
    status_cand = {s.codigo: s for s in (await db.execute(select(StatusCandidatura))).scalars().all()}
    tipo_denuncia = {t.codigo: t.tipo_id for t in (await db.execute(select(TipoDenuncia))).scalars().all()}
    status_denuncia = {s.codigo: s.status_id for s in (await db.execute(select(StatusDenuncia))).scalars().all()}

    async def get_or_create_candidato(
        email: str, nome: str, cargo: str, nivel_codigo: str, setor: str,
        localidade: str, anos: int, skills: list[tuple[str, str]],
    ) -> Candidato:
        existente = await db.execute(
            select(User).where(User.email == email).options(selectinload(User.candidato))
        )
        user = existente.scalar_one_or_none()
        if user is not None:
            return user.candidato

        candidato = Candidato(
            cargo=cargo, nivel_id=niveis[nivel_codigo].nivel_id, setor_atuacao=setor,
            localidade=localidade, anos_experiencia=anos, perfil_completo=70,
        )
        db.add(candidato)
        await db.flush()
        for nome_skill, categoria_codigo in skills:
            db.add(
                Skill(
                    candidato_id=candidato.candidato_id, nome=nome_skill,
                    categoria_skill_id=categorias[categoria_codigo].categoria_skill_id,
                )
            )
        db.add(
            User(
                email=email, senha_hash=hash_senha("123456"), nome=nome,
                tipo_usuario_id=tipos["candidato"].tipo_usuario_id,
                candidato_id=candidato.candidato_id,
            )
        )
        criados["candidatos"] += 1
        return candidato

    async def get_or_create_empresa(
        email: str, nome: str, cnpj: str, setor: str, sede: str, status_codigo: str
    ) -> Empresa:
        existente = await db.execute(select(Empresa).where(Empresa.cnpj == cnpj))
        empresa = existente.scalar_one_or_none()
        if empresa is not None:
            return empresa

        empresa = Empresa(
            nome=nome, cnpj=cnpj, setor=setor,
            status_validacao_id=status_emp[status_codigo].status_validacao_id,
            sede=sede, logo_inicial=nome[:1].upper(),
        )
        db.add(empresa)
        await db.flush()

        email_existente = await db.execute(select(User).where(User.email == email))
        if email_existente.scalar_one_or_none() is None:
            db.add(
                User(
                    email=email, senha_hash=hash_senha("123456"), nome=f"RH {nome}",
                    tipo_usuario_id=tipos["empresa"].tipo_usuario_id, empresa_id=empresa.empresa_id,
                )
            )
        criados["empresas"] += 1
        return empresa

    async def get_or_create_vaga(
        codigo: str, titulo: str, empresa: Empresa, nivel_codigo: str, salario_min: float,
        salario_max: float, tipo_contrato_codigo: str, distrito: str, descricao: str,
        habilidades: list[str],
    ) -> Vaga:
        existente = await db.execute(select(Vaga).where(Vaga.codigo == codigo))
        vaga = existente.scalar_one_or_none()
        if vaga is not None:
            return vaga

        vaga = Vaga(
            codigo=codigo, titulo=titulo, empresa_id=empresa.empresa_id,
            setor_atuacao=empresa.setor, distrito=distrito, nivel_id=niveis[nivel_codigo].nivel_id,
            salario_min=salario_min, salario_max=salario_max,
            tipo_contrato_id=tipos_contrato[tipo_contrato_codigo].tipo_contrato_id,
            descricao=descricao,
        )
        db.add(vaga)
        await db.flush()
        for nome_habilidade in habilidades:
            db.add(VagaHabilidade(vaga_id=vaga.vaga_id, nome=nome_habilidade))
        criados["vagas"] += 1
        return vaga

    async def get_or_create_candidatura(candidato: Candidato, vaga: Vaga, status_codigo: str) -> None:
        existente = await db.execute(
            select(Candidatura).where(
                Candidatura.candidato_id == candidato.candidato_id, Candidatura.vaga_id == vaga.vaga_id
            )
        )
        if existente.scalar_one_or_none() is not None:
            return
        db.add(
            Candidatura(
                candidato_id=candidato.candidato_id, vaga_id=vaga.vaga_id,
                status_id=status_cand[status_codigo].status_id,
            )
        )
        criados["candidaturas"] += 1

    # --- Candidatos ---
    joao = await get_or_create_candidato(
        "joao@daia.com", "João Silva", "Técnico em Eletromecânica", "pleno", "Industrial",
        "Anápolis - GO", 5, [("CLP", "operacao_manutencao"), ("NR-10", "normas_seguranca")],
    )
    carlos = await get_or_create_candidato(
        "carlos@daia.com", "Carlos Mendes", "Eng. Produção Jr.", "junior", "Industrial",
        "Anápolis - GO", 2, [("Excel Avançado", "tecnica"), ("Lean Manufacturing", "gestao")],
    )
    ana = await get_or_create_candidato(
        "ana@daia.com", "Ana Lúcia Silva", "Analista de Processos", "pleno", "Industrial",
        "Goiânia - GO", 4, [("Six Sigma", "gestao"), ("SAP", "tecnica")],
    )
    mariana = await get_or_create_candidato(
        "mariana@daia.com", "Mariana Costa", "Eng. Sênior", "senior", "Industrial",
        "Anápolis - GO", 9, [("Gestão de Projetos", "gestao"), ("AutoCAD", "tecnica")],
    )

    # --- Empresas ---
    pharma = await get_or_create_empresa(
        "rh@pharmalogistics.daia.com", "Pharmalogistics SA", "11222333000144",
        "Farmacêutico", "DAIA II", "validada",
    )
    alimentos = await get_or_create_empresa(
        "contato@goiasalimentos.daia.com", "Goiás Alimentos Ltda.", "22333444000155",
        "Alimentos", "DAIA I", "em_analise",
    )
    tech = await get_or_create_empresa(
        "rh@techquimica.daia.com", "TechQuímica Brasil", "33444555000166",
        "Química", "DAIA III", "divergencia_rfb",
    )
    logistica = await get_or_create_empresa(
        "contato@daialogistica.daia.com", "DAIA Logística e Transportes", "44555666000177",
        "Logística", "DAIA IV", "validada",
    )

    # --- Vagas ---
    v_qualidade = await get_or_create_vaga(
        "DEMO-V01", "Analista de Controle de Qualidade", pharma, "pleno", 3500, 5000,
        "full_time", "DAIA II", "Vaga de demonstração.", ["Six Sigma", "SAP"],
    )
    v_seguranca = await get_or_create_vaga(
        "DEMO-V02", "Inspetor de Segurança", pharma, "pleno", 3800, 5200,
        "urgent_hire", "DAIA II", "Vaga de demonstração.", ["NR-10", "NR-12"],
    )
    v_producao = await get_or_create_vaga(
        "DEMO-V03", "Coordenador de Linha de Produção", alimentos, "pleno", 4000, 5800,
        "full_time", "DAIA I", "Vaga de demonstração.", ["Lean Manufacturing", "Excel Avançado"],
    )
    v_processos = await get_or_create_vaga(
        "DEMO-V04", "Engenheiro de Processos Sênior", tech, "senior", 8000, 12000,
        "full_time", "DAIA III", "Vaga de demonstração.", ["Gestão de Projetos", "AutoCAD"],
    )
    v_logistica = await get_or_create_vaga(
        "DEMO-V05", "Supervisor de Operações Logísticas", logistica, "pleno", 3200, 4800,
        "full_time", "DAIA IV", "Vaga de demonstração.", ["Gestão de Estoque", "Excel Avançado"],
    )

    # --- Candidaturas ---
    await get_or_create_candidatura(joao, v_seguranca, "triagem")
    await get_or_create_candidatura(carlos, v_producao, "entrevista_rh")
    await get_or_create_candidatura(ana, v_qualidade, "avaliacao_tecnica")
    await get_or_create_candidatura(mariana, v_processos, "contratado")
    await get_or_create_candidatura(joao, v_logistica, "triagem")

    await db.commit()

    # --- Denúncias ---
    async def criar_denuncia_se_nao_existe(tipo_codigo: str, alvo: str, descricao: str, status_codigo: str) -> None:
        # alvo sozinho não é único o bastante (duas denúncias fictícias miram a
        # mesma empresa) — checa a combinação alvo+tipo.
        existente = await db.execute(
            select(Denuncia).where(
                Denuncia.alvo == alvo, Denuncia.tipo_id == tipo_denuncia[tipo_codigo]
            )
        )
        if existente.scalar_one_or_none() is not None:
            return
        db.add(
            Denuncia(
                tipo_id=tipo_denuncia[tipo_codigo], alvo=alvo, descricao=descricao,
                status_id=status_denuncia[status_codigo],
            )
        )
        criados["denuncias"] += 1

    await criar_denuncia_se_nao_existe(
        "vaga_falsa", "Vaga: Operador de Máquinas (Falsa)",
        "Cobrança de taxa para participação em processo seletivo.", "pendente",
    )
    await criar_denuncia_se_nao_existe(
        "comportamento_inadequado", "Empresa: TechQuímica Brasil",
        "Comportamento inadequado relatado por candidatos.", "pendente",
    )
    await criar_denuncia_se_nao_existe(
        "fraude", "Empresa: TechQuímica Brasil", "Divergência cadastral com RFB.", "em_investigacao",
    )

    await db.commit()
    return criados
