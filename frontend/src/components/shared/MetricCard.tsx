import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  delta?: string
  trend?: 'up' | 'down' | 'warning' | 'neutral'
  className?: string
}

export function MetricCard({ label, value, unit, delta, trend = 'neutral', className }: MetricCardProps) {
  const trendIcon = {
    up: <TrendingUp className="h-3.5 w-3.5" />,
    down: <TrendingDown className="h-3.5 w-3.5" />,
    warning: <AlertCircle className="h-3.5 w-3.5" />,
    neutral: null,
  }
  const trendColor = {
    up: 'text-daia-green',
    down: 'text-destructive',
    warning: 'text-amber-600',
    neutral: 'text-muted-foreground',
  }

  return (
    <Card className={cn('p-5', className)}>
      <div className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-daia-blue">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {delta && (
        <div className={cn('mt-2 flex items-center gap-1 text-xs font-medium', trendColor[trend])}>
          {trendIcon[trend]}
          {delta}
        </div>
      )}
    </Card>
  )
}
