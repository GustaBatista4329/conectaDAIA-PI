import type { Candidato } from '@/types'

export interface PerfilChecklistItem {
  label: string
  done: boolean
}

// Checklist real de completude do perfil do candidato — reflete exatamente
// as seções editáveis em "Meu Perfil" (CandidateProfile.tsx). Currículo
// fica de fora por decisão de produto: não deve contar pra essa métrica.
//
// Centralizado aqui (em vez de recalculado em cada tela) porque o Painel e
// o próprio "Meu Perfil" mostram esse percentual lado a lado — se cada um
// calculasse do seu jeito, os dois números divergiam (ex: o `perfilCompleto`
// que vem do backend é só um contador gamificado incrementado por ação, não
// reflete se as seções estão de fato preenchidas).
export function getPerfilChecklist(candidato: Candidato): PerfilChecklistItem[] {
  return [
    { label: 'Conte um pouco sobre você em "Sobre mim"', done: !!candidato.sobreMim?.trim() },
    { label: 'Adicione ao menos uma formação acadêmica', done: candidato.formacoes.length > 0 },
    { label: 'Adicione ao menos uma experiência profissional', done: candidato.experiencias.length > 0 },
    { label: 'Adicione ao menos uma skill', done: candidato.skills.length > 0 },
  ]
}

export function getPerfilCompletoPercentual(candidato: Candidato): number {
  const checklist = getPerfilChecklist(candidato)
  if (checklist.length === 0) return 0
  const done = checklist.filter((item) => item.done).length
  return Math.round((done / checklist.length) * 100)
}
