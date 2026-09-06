import { createContext, useContext, useState, ReactNode } from 'react'

interface DataContextValue {
  // Incremento usado como "trigger" de re-fetch em listagens.
  // Ao mutar dados (candidatar, mover kanban, validar empresa)
  // chame bump() e componentes reagem no useEffect([bumpCount]).
  bumpCount: number
  bump: () => void
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [bumpCount, setBumpCount] = useState(0)
  const bump = () => setBumpCount((v) => v + 1)
  return <DataContext.Provider value={{ bumpCount, bump }}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider')
  return ctx
}
