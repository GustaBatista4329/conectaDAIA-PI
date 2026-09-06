import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, Clock, MapPin } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Vaga } from '@/types'

interface JobCardProps {
  vaga: Vaga
  alreadyApplied?: boolean
  onDetails?: (vaga: Vaga) => void
  onApply?: (vaga: Vaga) => void
  showMatch?: boolean
}

export function JobCard({ vaga, alreadyApplied, onDetails, onApply, showMatch }: JobCardProps) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-md bg-daia-blue-light flex items-center justify-center text-daia-blue font-bold text-sm shrink-0">
          {vaga.empresaNome.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-daia-blue-mid font-semibold uppercase tracking-wider">
            <span>{vaga.empresaNome}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{vaga.distrito}</span>
            {showMatch && vaga.matchPercentual !== undefined && (
              <Badge variant="success" className="ml-auto">
                {vaga.matchPercentual}% de match
              </Badge>
            )}
          </div>

          <h3 className="mt-1 font-semibold text-lg text-foreground leading-tight">{vaga.titulo}</h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {formatCurrency(vaga.salarioMin)} – {formatCurrency(vaga.salarioMax)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {vaga.tipoContrato}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {vaga.setorAtuacao}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onDetails && (
            <Button variant="ghost" size="sm" onClick={() => onDetails(vaga)}>
              Detalhes
            </Button>
          )}
          {onApply && (
            <Button
              size="sm"
              variant={alreadyApplied ? 'outline' : 'default'}
              disabled={alreadyApplied}
              onClick={() => !alreadyApplied && onApply(vaga)}
            >
              {alreadyApplied ? 'Candidatado' : 'Candidatar-se'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
