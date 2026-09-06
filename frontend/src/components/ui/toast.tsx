import * as React from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])

  const show = React.useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random()
    setItems((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id))
    }, 3500)
  }, [])

  const dismiss = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id))

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(92vw,380px)]">
        {items.map((t) => {
          const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? XCircle : Info
          return (
            <div
              key={t.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border bg-background shadow-lg p-3 animate-fade-in',
                t.type === 'success' && 'border-l-4 border-l-daia-green',
                t.type === 'error' && 'border-l-4 border-l-destructive',
                t.type === 'info' && 'border-l-4 border-l-daia-blue-mid',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 mt-0.5 flex-shrink-0',
                  t.type === 'success' && 'text-daia-green',
                  t.type === 'error' && 'text-destructive',
                  t.type === 'info' && 'text-daia-blue-mid',
                )}
              />
              <p className="flex-1 text-sm text-foreground">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fechar notificação"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}
