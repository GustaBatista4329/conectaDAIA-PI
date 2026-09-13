// Valores fechados usados tanto no filtro de busca (JobSearch) quanto na
// criação de vaga (RecruiterVagas/RecruiterProfile) — centralizados aqui pra
// garantir que as duas pontas usem exatamente os mesmos rótulos e códigos
// (um texto levemente diferente faz o filtro nunca encontrar a vaga).
import type { AreaProfissional, LocalTrabalho, Vaga } from '@/types'
import type { ComboboxOption } from '@/components/ui/combobox'

export const DISTRITOS = [
  'DAIA Setor 1',
  'DAIA Setor 2',
  'DAIA Setor 3',
  'DAIA Setor 4',
  'DAIA Industrial',
]

export const NIVEIS: Array<Vaga['nivel']> = ['Junior', 'Pleno', 'Sênior', 'Gerência']

export const NIVEL_NOME_PARA_CODIGO: Record<string, string> = {
  Junior: 'junior',
  Pleno: 'pleno',
  Sênior: 'senior',
  Gerência: 'gerencia',
}

export const TIPOS_CONTRATO: Array<Vaga['tipoContrato']> = [
  'Tempo Integral',
  'Meio Período',
  'Temporário',
  'Contratação Urgente',
]

export const TIPO_CONTRATO_NOME_PARA_CODIGO: Record<string, string> = {
  'Tempo Integral': 'full_time',
  'Meio Período': 'meio_periodo',
  Temporário: 'temporario',
  'Contratação Urgente': 'urgent_hire',
}

// Rótulos de exibição de LocalTrabalho — usado tanto por experiência
// profissional do candidato quanto por vaga (mesmo Enum no backend).
export const LOCAL_TRABALHO_LABELS: Record<LocalTrabalho, string> = {
  PRESENCIAL: 'Presencial',
  HIBRIDO: 'Híbrido',
  REMOTO: 'Remoto',
}

export const LOCAIS_TRABALHO: LocalTrabalho[] = ['PRESENCIAL', 'HIBRIDO', 'REMOTO']

// Área profissional do CARGO de uma vaga (o que ela faz) — não é o setor da
// empresa que a publica (Empresa.setor continua livre: uma farmacêutica
// pode publicar uma vaga de advogado, por exemplo). Precisa bater com
// app.models.enums.AreaProfissional (backend).
export const AREA_PROFISSIONAL_LABELS: Record<AreaProfissional, string> = {
  ADMINISTRACAO: 'Administração',
  RECURSOS_HUMANOS: 'Recursos Humanos',
  JURIDICO_ADVOCACIA: 'Jurídico/Advocacia',
  CONTABILIDADE: 'Contabilidade',
  FINANCEIRO: 'Financeiro',
  MARKETING: 'Marketing',
  VENDAS_COMERCIAL: 'Vendas/Comercial',
  ATENDIMENTO_AO_CLIENTE: 'Atendimento ao Cliente',
  TECNOLOGIA_DA_INFORMACAO: 'Tecnologia da Informação/Desenvolvimento de Software',
  ENGENHARIA_CIVIL: 'Engenharia Civil',
  ENGENHARIA_MECANICA: 'Engenharia Mecânica',
  ENGENHARIA_ELETRICA: 'Engenharia Elétrica',
  ENGENHARIA_DE_PRODUCAO: 'Engenharia de Produção',
  ENGENHARIA_QUIMICA: 'Engenharia Química',
  ENGENHARIA_DE_ALIMENTOS: 'Engenharia de Alimentos',
  ENGENHARIA_AMBIENTAL: 'Engenharia Ambiental',
  ARQUITETURA: 'Arquitetura',
  LOGISTICA: 'Logística',
  COMPRAS_SUPRIMENTOS: 'Compras/Suprimentos',
  PRODUCAO_OPERACOES_INDUSTRIAIS: 'Produção/Operações Industriais',
  MANUTENCAO_INDUSTRIAL: 'Manutenção Industrial',
  QUALIDADE: 'Qualidade',
  SEGURANCA_DO_TRABALHO: 'Segurança do Trabalho',
  SAUDE_E_MEDICINA: 'Saúde e Medicina',
  ENFERMAGEM: 'Enfermagem',
  FARMACIA: 'Farmácia',
  NUTRICAO: 'Nutrição',
  PSICOLOGIA: 'Psicologia',
  EDUCACAO_DOCENCIA: 'Educação/Docência',
  DESIGN_GRAFICO: 'Design Gráfico',
  COMUNICACAO_JORNALISMO: 'Comunicação/Jornalismo',
  PUBLICIDADE_E_PROPAGANDA: 'Publicidade e Propaganda',
  RECEPCAO_SECRETARIADO: 'Recepção/Secretariado',
  ALMOXARIFADO: 'Almoxarifado',
  TRANSPORTE_MOTORISTA: 'Transporte/Motorista',
  CONSTRUCAO_CIVIL: 'Construção Civil (mão de obra)',
  ELETRICISTA: 'Eletricista',
  MECANICA_AUTOMOTIVA: 'Mecânica Automotiva',
  METALURGIA_SOLDA: 'Metalurgia/Solda',
  AGRONOMIA: 'Agronomia',
  VETERINARIA: 'Veterinária',
  ZOOTECNIA: 'Zootecnia',
  MEIO_AMBIENTE_SUSTENTABILIDADE: 'Meio Ambiente/Sustentabilidade',
  AUDITORIA: 'Auditoria',
  CONTROLADORIA: 'Controladoria',
  ECONOMIA: 'Economia',
  ESTATISTICA_CIENCIA_DE_DADOS: 'Estatística/Ciência de Dados',
  BIOMEDICINA: 'Biomedicina',
  BIOLOGIA_BIOTECNOLOGIA: 'Biologia/Biotecnologia',
  QUIMICA_LABORATORIO: 'Química (laboratório/análises)',
  TURISMO_HOTELARIA: 'Turismo/Hotelaria',
  GASTRONOMIA: 'Gastronomia',
  SERVICOS_GERAIS_LIMPEZA: 'Serviços Gerais/Limpeza',
  SEGURANCA_PATRIMONIAL: 'Segurança Patrimonial',
  TELECOMUNICACOES: 'Telecomunicações',
  ELETRONICA: 'Eletrônica',
  AUTOMACAO_INDUSTRIAL: 'Automação Industrial',
  COMERCIO_EXTERIOR: 'Comércio Exterior/Importação e Exportação',
  RELACOES_PUBLICAS: 'Relações Públicas',
  GESTAO_DE_PROJETOS: 'Gestão de Projetos',
  OUTRA: 'Outra',
}

export const AREAS_PROFISSIONAIS_OPTIONS: ComboboxOption[] = Object.entries(
  AREA_PROFISSIONAL_LABELS,
).map(([value, label]) => ({ value, label }))
