import { Link } from 'react-router-dom'

import { Container } from '@/components/common/Container'
import { Logo } from '@/components/common/Logo'
import { categories } from '@/config/categories'
import type { NavigationItem } from '@/config/navigation'
import { institutionalNavigation, legalNavigation } from '@/config/navigation'
import { siteConfig } from '@/config/site'
import { paths } from '@/routes/paths'
import { getCurrentYear } from '@/utils/date'

interface FooterColumnProps {
  title: string
  links: readonly NavigationItem[]
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <nav aria-label={title}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-light">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="text-sm text-white/60 transition-colors hover:text-paper"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function SiteFooter() {
  const currentYear = getCurrentYear()

  return (
    <footer className="mt-auto border-t-4 border-brand bg-night text-paper">
      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-12">
          <div className="max-w-sm">
            <Logo inverted />
            <p className="mt-5 text-sm leading-relaxed text-white/60">
              Un proyecto editorial dedicado a la actualidad de Metapán, Santa Ana y El Salvador,
              con contexto, verificación y servicio público.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 border border-night-rule px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-light" aria-hidden="true" />
              {siteConfig.launchStatus}
            </p>
          </div>

          <FooterColumn
            title="Secciones"
            links={categories.map((category) => ({
              label: category.name,
              to: paths.category(category.slug),
            }))}
          />

          <FooterColumn
            title="El portal"
            links={[
              ...institutionalNavigation,
              { label: 'Buscar noticias', to: paths.search },
            ]}
          />

          <FooterColumn title="Legal" links={legalNavigation} />
        </div>
      </Container>

      <div className="border-t border-night-rule">
        <Container className="flex flex-col gap-3 py-5 text-[9px] uppercase tracking-[0.14em] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} Prensa Metapán. Todos los derechos reservados.</p>
          <p>Metapán, Santa Ana · El Salvador</p>
        </Container>
      </div>
    </footer>
  )
}
