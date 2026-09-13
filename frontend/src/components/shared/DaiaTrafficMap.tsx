import { useEffect, useRef, useState } from 'react'
import * as tt from '@tomtom-international/web-sdk-maps'
import '@tomtom-international/web-sdk-maps/dist/maps.css'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import {
  DAIA_BOUNDS,
  DAIA_CENTER,
  DAIA_DEFAULT_ZOOM,
  DAIA_MAX_ZOOM,
  DAIA_MIN_ZOOM,
} from '@/lib/daia'

const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY as string | undefined

// Estilo híbrido (satélite + ruas + POIs) em vez do vetorial básico — mostra
// prédios, terreno e vias com muito mais detalhe visual pra um card de tráfego.
const DAIA_MAP_STYLE = {
  map: '2/hybrid_street-satellite',
  poi: '2/poi_dynamic-light',
  trafficIncidents: '2/incidents_light',
  trafficFlow: '2/flow_relative-light',
} as const

// Se o mapa não terminar de carregar nesse tempo (tile bloqueado, key inválida,
// rede fora do ar etc.), desiste e mostra o placeholder de erro.
const LOAD_TIMEOUT_MS = 10_000

type Status = 'loading' | 'ready' | 'error'

/**
 * Mapa de tráfego ao vivo (TomTom) travado na região do DAIA: o usuário não
 * consegue arrastar/dar zoom out pra fora do distrito (maxBounds + min/maxZoom).
 * Mostra um placeholder enquanto carrega e outro (com retry) se a requisição falhar.
 */
export function DaiaTrafficMap({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return

    if (!TOMTOM_API_KEY) {
      setErrorMessage('Configure VITE_TOMTOM_API_KEY no .env do frontend.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage(null)

    const map = tt.map({
      key: TOMTOM_API_KEY,
      container: containerRef.current,
      style: DAIA_MAP_STYLE,
      center: DAIA_CENTER,
      zoom: DAIA_DEFAULT_ZOOM,
      minZoom: DAIA_MIN_ZOOM,
      maxZoom: DAIA_MAX_ZOOM,
      maxBounds: DAIA_BOUNDS,
      dragRotate: false,
      pitchWithRotate: false,
    })

    const timeoutId = window.setTimeout(() => {
      setErrorMessage('O tráfego ao vivo está demorando demais pra carregar.')
      setStatus('error')
    }, LOAD_TIMEOUT_MS)

    map.on('load', () => {
      window.clearTimeout(timeoutId)
      // Container fica dentro de um card com aspect-ratio, carregado via
      // lazy/Suspense — se o layout ainda não tinha o tamanho final quando o
      // mapa foi criado, o canvas fica com dimensão errada e o arrasto do
      // mouse não bate com o movimento real (parece travado/bugado).
      map.resize()
      map.showTrafficFlow()
      map.showTrafficIncidents()
      setStatus('ready')
    })

    map.on('error', (e) => {
      console.error('Erro ao carregar o mapa de tráfego TomTom', e)
      window.clearTimeout(timeoutId)
      setErrorMessage('Não foi possível carregar o tráfego ao vivo agora.')
      setStatus('error')
    })

    return () => {
      window.clearTimeout(timeoutId)
      map.remove()
    }
  }, [retryCount])

  return (
    // className (posicionamento vindo do card pai, ex: "absolute inset-0
    // h-full w-full") fica isolado nesse elemento externo; o "relative" pros
    // overlays internos vive num wrapper à parte pra não colidir no twMerge.
    <div className={className ?? 'h-full w-full'}>
      <div className="relative h-full w-full">
        {/* Fica sempre montado — o SDK precisa do container no DOM antes do
            efeito rodar, inclusive numa nova tentativa após erro. */}
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />

        {status === 'loading' && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted px-6 text-center text-sm text-muted-foreground">
            <AlertTriangle className="h-6 w-6 text-daia-yellow" />
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={() => {
                setStatus('loading')
                setRetryCount((n) => n + 1)
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
