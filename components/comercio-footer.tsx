'use client'

import Link from 'next/link'
import { StockiaLogo } from '@/components/stockia-logo'

const footerCols = [
  { title: 'Comprar', links: ['Distribuidores', 'Categorías', 'Ofertas', 'Mis pedidos'] },
  { title: 'Soporte', links: ['Centro de ayuda', 'Contacto', 'Términos', 'Privacidad'] },
  { title: 'StockIA', links: ['Para distribuidoras', 'Cómo funciona', 'Empresa'] },
]

const footerLinks: Record<string, string> = {
  'Distribuidores': '/comercio/distribuidoras',
  'Categorías': '/comercio/buscar',
  'Ofertas': '/comercio/buscar',
  'Mis pedidos': '/comercio/pedidos',
  'Centro de ayuda': '/comercio/ayuda',
  'Contacto': '/comercio/contacto',
  'Términos': '/comercio/terminos',
  'Privacidad': '/comercio/privacidad',
  'Para distribuidoras': '/login',
  'Cómo funciona': '/comercio/como-funciona',
  'Empresa': '/comercio/empresa',
}

export function ComercioFooter() {
  return (
    <footer className="hidden lg:block bg-[#0B1A45] text-white/70 mt-16">


      {/* Main grid */}
      <div className="max-w-350 mx-auto px-8 py-12 grid grid-cols-12 gap-8 text-sm">
        {/* Brand col */}
        <div className="col-span-4">
          <StockiaLogo size={32} variant="white" className="h-8" />
          <p className="mt-4 text-xs text-white/40 max-w-xs leading-relaxed">
            Una herramienta clara para mover stock entre quienes lo mueven.
          </p>
          <div className="mt-5 flex gap-2">
            <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-white/60">PCI DSS</span>
            <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-white/60">SSL 256-bit</span>
            <span className="px-2 py-1 rounded-md bg-[#C8FF00]/15 text-[10px] font-bold text-[#C8FF00]">2026</span>
          </div>
        </div>

        {/* Link cols */}
        {footerCols.map((col) => (
          <div key={col.title} className="col-span-2">
            <h4 className="text-white font-semibold mb-3 text-sm">{col.title}</h4>
            <ul className="space-y-2 text-xs">
              {col.links.map((item) => (
                <li key={item}>
                  <Link
                    href={footerLinks[item] ?? '#'}
                    className="hover:text-[#C8FF00] transition"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Newsletter col */}
        <div className="col-span-2">
          <h4 className="text-white font-semibold mb-3 text-sm">Recibí ofertas</h4>
          <p className="text-xs text-white/40 mb-2">Promos y novedades en tu mail</p>
          <div className="flex gap-1">
            <input
              placeholder="Tu email"
              className="flex-1 h-9 px-3 rounded-lg bg-white/5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:bg-white/10 transition"
            />
            <button className="h-9 px-3 rounded-lg bg-white text-[#0B1A45] text-xs font-bold hover:bg-white/90 transition">
              OK
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-350 mx-auto px-8 py-4 flex items-center justify-between text-xs text-white/35">
          <span>© 2026 StockIA. Todos los derechos reservados.</span>
          <span>Hecho en Argentina 🇦🇷</span>
        </div>
      </div>
    </footer>
  )
}
