import { cn } from '@/lib/utils'

// Marca ConectaDAIA (implementada em código, não como imagem raster) — um
// "C" em anel com uma barra verde atravessando a abertura, representando a
// conexão entre candidato e indústria. Cores vêm direto dos tokens `daia.*`
// do tailwind.config.js, então qualquer ajuste de paleta se propaga aqui
// automaticamente.
//
// `reversed` troca o anel pra branco — uso exclusivo sobre fundo escuro,
// sempre dentro de um `LogoBadge` (ver abaixo), nunca solto.
export function LogoIcon({ className, reversed = false }: { className?: string; reversed?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        d="M 75.2 69.7 A 32 32 0 1 1 75.2 30.3"
        fill="none"
        strokeWidth="20"
        className={reversed ? 'stroke-white' : 'stroke-daia-blue'}
      />
      <rect x="50" y="41" width="33" height="18" className="fill-daia-green" />
    </svg>
  )
}

// Sobre fundo escuro ou foto, o ícone precisa de uma "placa" azul sólida
// atrás (regra do guia de marca) em vez de ficar solto — do contrário o
// anel de contorno azul do LogoIcon normal desaparece no fundo escuro.
export function LogoBadge({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-md bg-daia-blue flex items-center justify-center shrink-0', className)}>
      <LogoIcon reversed className="h-[62%] w-[62%]" />
    </div>
  )
}

interface WordmarkProps {
  className?: string
  /** 'light' = fundo claro, texto azul · 'dark' = fundo escuro, texto branco */
  tone?: 'light' | 'dark'
  withTagline?: boolean
}

// "Conecta" em peso regular + "DAIA" em peso extra-bold, sempre na mesma
// cor (o guia de marca proíbe cores diferentes entre as duas partes).
export function Wordmark({ className, tone = 'light', withTagline = false }: WordmarkProps) {
  const textColor = tone === 'dark' ? 'text-white' : 'text-daia-blue'
  return (
    <div className={className}>
      <span className={cn('font-semibold leading-none', textColor)}>
        Conecta
        <span className="font-extrabold">DAIA</span>
      </span>
      {withTagline && (
        <>
          <div
            className={cn(
              'mt-2 h-[3px] w-40 rounded-full bg-gradient-to-r',
              tone === 'dark' ? 'from-white/50 to-daia-green' : 'from-daia-blue to-daia-green',
            )}
          />
          <div
            className={cn(
              'mt-2 text-[11px] font-semibold uppercase tracking-widest',
              tone === 'dark' ? 'text-white/70' : 'text-muted-foreground',
            )}
          >
            Trabalho real. Informação verificada.
          </div>
        </>
      )}
    </div>
  )
}
