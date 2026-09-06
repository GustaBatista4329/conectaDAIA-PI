import { Link } from 'react-router-dom'
import { Construction, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { PublicFooter } from '@/components/layout/PublicFooter'

interface Props {
  title: string
  description?: string
  publicLayout?: boolean
}

export default function Placeholder({ title, description, publicLayout = false }: Props) {
  const content = (
    <div className="flex items-center justify-center py-20">
      <Card className="p-10 text-center max-w-md">
        <div className="h-16 w-16 rounded-full bg-daia-blue-light text-daia-blue-mid flex items-center justify-center mx-auto">
          <Construction className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-daia-blue">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {description ?? 'Esta funcionalidade está no backlog do MVP e será liberada em breve.'}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Início
          </Link>
        </Button>
      </Card>
    </div>
  )

  if (publicLayout) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNavbar />
        <div className="flex-1">{content}</div>
        <PublicFooter />
      </div>
    )
  }
  return content
}
