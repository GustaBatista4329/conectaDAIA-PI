import { Link } from 'react-router-dom'

export function PublicFooter() {
  return (
    <footer className="gradient-daia text-white mt-20">
      <div className="mx-auto max-w-7xl px-6 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="font-bold text-lg mb-3">ConectaDAIA</div>
          <p className="text-sm text-white/70 max-w-xs">
            A ponte entre a excelência industrial e os melhores talentos no coração do Brasil.
          </p>
        </div>
        <div>
          <h4 className="uppercase text-xs font-semibold tracking-wider text-white/60 mb-3">Plataforma</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link to="/vagas" className="hover:text-white">Busca de Vagas</Link></li>
            <li><Link to="/setores" className="hover:text-white">Setores</Link></li>
            <li><Link to="/empresas" className="hover:text-white">Mapa do Setor</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="uppercase text-xs font-semibold tracking-wider text-white/60 mb-3">Jurídico</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><a href="#" className="hover:text-white">Política de Privacidade</a></li>
            <li><a href="#" className="hover:text-white">Termos de Serviço</a></li>
          </ul>
        </div>
        <div>
          <h4 className="uppercase text-xs font-semibold tracking-wider text-white/60 mb-3">Institucional</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><a href="#" className="hover:text-white">Portal DAIA</a></li>
            <li><a href="#" className="hover:text-white">Prefeitura de Anápolis</a></li>
            <li><a href="#" className="hover:text-white">Governo de Goiás</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-4 text-xs text-white/60 text-center">
          © 2025 ConectaDAIA. Distrito Agroindustrial de Anápolis — Governo de Goiás.
        </div>
      </div>
    </footer>
  )
}
