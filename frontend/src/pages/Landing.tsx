import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Briefcase, Users } from 'lucide-react'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiVagas } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { AREA_PROFISSIONAL_LABELS } from '@/lib/vagaConstants'
import type { Vaga } from '@/types'
import industriaFarmaceuticaImg from '@/assets/industria_farmaceutica.jpg'
import logisticaImg from '@/assets/logistica_image.avif'
import agroindustriaImg from '@/assets/agroindustria_image.avif'
import daiaImg from '@/assets/daia_image.jpg'

const setores = [
  {
    nome: 'Farmoquímico',
    descricao: 'O segundo maior hub farmoquímico da América Latina.',
    imagem: industriaFarmaceuticaImg,
  },
  {
    nome: 'Logística',
    descricao: 'Hubs logísticos e transportadoras intermodais conectadas ao Brasil.',
    imagem: logisticaImg,
  },
  {
    nome: 'Agroindústria',
    descricao: 'Tecnologias agroindustriais e o abastecimento do Centro-Oeste.',
    imagem: agroindustriaImg,
  },
]

export default function Landing() {
  const nav = useNavigate()
  const [destaque, setDestaque] = useState<Vaga[]>([])

  useEffect(() => {
    apiVagas.listar().then((vs) => setDestaque(vs.slice(0, 3)))
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      {/* HERO */}
      <section className="relative gradient-daia text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-15 bg-cover bg-center"
          style={{ backgroundImage: `url(${daiaImg})` }}
        />
        <div className="absolute inset-0 gradient-daia opacity-85" />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24">
          <div className="text-xs font-semibold tracking-widest text-daia-yellow/90 uppercase">
            DAIA · Anápolis · Goiás
          </div>
          <h1 className="mt-4 text-5xl md:text-6xl font-bold leading-tight text-balance max-w-3xl">
            Encontre seu lugar no maior polo industrial do Centro-Oeste
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="bg-white text-daia-blue hover:bg-white/90" onClick={() => nav('/vagas')}>
              Quero Trabalhar
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white"
              onClick={() => nav('/registro?perfil=empresa')}
            >
              Quero Contratar
              <Users className="h-4 w-4" />
            </Button>
          </div>

          {/* KPIs */}
          <div className="mt-16 bg-white rounded-xl shadow-xl p-6 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x gap-4 sm:gap-0 text-daia-blue max-w-3xl">
            <div className="text-center pt-4 first:pt-0 sm:pt-0">
              <div className="text-3xl font-bold">30k+</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                Empregos Ativos
              </div>
            </div>
            <div className="text-center pt-4 sm:pt-0">
              <div className="text-3xl font-bold">150+</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                Empresas Instaladas
              </div>
            </div>
            <div className="text-center pt-4 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-daia-green">Novas Obras</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                Expansão do Setor 3
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VAGAS EM DESTAQUE */}
      <section className="mx-auto max-w-7xl px-6 py-16 w-full">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-daia-blue">Vagas em Destaque</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Conecte-se com as principais indústrias farmacêuticas, logísticas e agroindustriais.
            </p>
          </div>
          <Link
            to="/vagas"
            className="text-sm font-semibold text-daia-blue-mid hover:underline inline-flex items-center gap-1"
          >
            Ver Todas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {destaque.map((vaga) => (
            <Card key={vaga.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                {AREA_PROFISSIONAL_LABELS[vaga.areaProfissional]}
                {vaga.tipoContrato === 'Contratação Urgente' && (
                  <Badge variant="success" className="ml-auto">
                    CONTRATANDO
                  </Badge>
                )}
              </div>
              <h3 className="mt-3 font-semibold leading-tight text-foreground">{vaga.titulo}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{vaga.descricao}</p>
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {vaga.salarioMin !== undefined && vaga.salarioMax !== undefined
                    ? `${formatCurrency(vaga.salarioMin)} – ${formatCurrency(vaga.salarioMax)}`
                    : 'Salário a combinar'}
                </div>
                <Button size="sm" variant="outline" onClick={() => nav('/vagas')}>
                  Candidatar-se
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* SETORES */}
      <section className="mx-auto max-w-7xl px-6 py-8 w-full">
        <h2 className="text-2xl font-bold text-daia-blue mb-2">Nossos Setores</h2>
        <p className="text-muted-foreground text-sm mb-8">
          A força do DAIA dividida por especialidades técnicas.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {setores.map((s) => (
            <div
              key={s.nome}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer"
            >
              <img
                src={s.imagem}
                alt={s.nome}
                className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-daia-blue/95 via-daia-blue/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="font-bold text-xl">{s.nome}</h3>
                <p className="text-sm text-white/80 mt-1">{s.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA EMPRESA */}
      <section className="mx-auto max-w-7xl px-6 py-16 w-full">
        <div className="gradient-daia rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold">Sua empresa busca os melhores talentos?</h2>
              <p className="mt-3 text-white/80 text-sm">
                Tenha acesso exclusivo à maior base de currículos qualificados do distrito industrial de Anápolis.
              </p>
              <Button
                className="mt-6 bg-white text-daia-blue hover:bg-white/90"
                onClick={() => nav('/registro?perfil=empresa')}
              >
                Anunciar Vagas Agora
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: '15k+', v: 'Currículos Ativos' },
                { k: '24h', v: 'Tempo de Triagem' },
                { k: '85%', v: 'Taxa de Match' },
                { k: 'VIP', v: 'Suporte Executivo' },
              ].map((item) => (
                <div key={item.k} className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold">{item.k}</div>
                  <div className="text-xs uppercase tracking-wider text-white/70 mt-1">{item.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
