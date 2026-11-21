import { CalendarDays, MapPin, Menu, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { Container } from '@/components/common/Container'
import { Logo } from '@/components/common/Logo'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { categories } from '@/config/categories'
import { siteConfig } from '@/config/site'
import { paths } from '@/routes/paths'
import { cn } from '@/utils/cn'
import { formatLongDate } from '@/utils/date'

const headerDate = new Date()
const headerDateLabel = formatLongDate(headerDate)
const headerDateISO = new Intl.DateTimeFormat('en-CA', {
  timeZone: siteConfig.timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(headerDate)

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    'relative inline-flex h-full shrink-0 items-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.15em] transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-brand after:transition-transform after:content-[""] hover:text-brand hover:after:scale-x-100',
    isActive ? 'text-brand after:scale-x-100' : 'text-ink/70',
  )
}

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <header className="bg-paper-strong">
        <div className="bg-night text-white/65">
          <Container className="flex min-h-9 items-center justify-between gap-4">
            <p className="flex min-w-0 items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] sm:text-[10px]">
              <MapPin
                aria-hidden="true"
                size={11}
                strokeWidth={1.8}
                className="shrink-0 text-brand-light"
              />
              <span className="truncate">Metapán · Santa Ana · El Salvador</span>
            </p>
            <p className="flex shrink-0 items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-white/45">
              <span className="h-1 w-1 bg-brand-light" aria-hidden="true" />
              Portal en preparación
            </p>
          </Container>
        </div>

        <Container>
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-5 md:grid-cols-[1fr_auto_1fr] md:py-7">
            <div className="hidden items-center gap-2 text-[9px] uppercase tracking-[0.12em] text-ink-muted md:flex">
              <CalendarDays aria-hidden="true" size={13} strokeWidth={1.6} />
              <time dateTime={headerDateISO} className="max-w-52 leading-relaxed">
                {headerDateLabel}
              </time>
            </div>

            <Logo className="justify-self-start md:justify-self-center" />

            <div className="flex items-center justify-end gap-2">
              <form action={paths.search} method="get" className="relative hidden lg:block">
                <Search aria-hidden="true" size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input name="q" type="search" aria-label="Buscar noticias" placeholder="Buscar noticias" minLength={2} maxLength={100} className="h-10 w-48 border border-rule-strong bg-paper px-9 pr-3 text-xs text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none xl:w-56" />
              </form>
              <Link
                to={paths.search}
                aria-label="Buscar noticias"
                className="hidden h-10 w-10 items-center justify-center border border-rule-strong text-ink-muted transition-colors hover:border-ink hover:bg-paper hover:text-ink sm:inline-flex"
              >
                <Search aria-hidden="true" size={17} strokeWidth={1.7} />
              </Link>

              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Abrir menú de navegación"
                aria-controls="mobile-navigation"
                aria-expanded={isMenuOpen}
                aria-haspopup="dialog"
                className="inline-flex h-10 items-center gap-2 border border-rule-strong px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-paper lg:hidden"
              >
                <Menu aria-hidden="true" size={16} strokeWidth={1.8} />
                <span className="hidden xs:inline">Menú</span>
              </button>

              <span className="hidden border-l border-rule pl-4 text-right text-[9px] uppercase leading-relaxed tracking-[0.14em] text-ink-muted lg:block">
                Edición digital
                <br />
                <span className="text-brand">Fase 1</span>
              </span>
            </div>
          </div>
        </Container>

        <div className="border-y border-rule">
          <Container>
            <nav
              aria-label="Navegación principal"
              className="flex h-11 items-center gap-5 overflow-x-auto [scrollbar-width:none] lg:justify-center lg:gap-7 [&::-webkit-scrollbar]:hidden"
            >
              <NavLink end to={paths.home} className={navLinkClassName}>
                Inicio
              </NavLink>
              {categories.map((category) => (
                <NavLink
                  key={category.slug}
                  to={paths.category(category.slug)}
                  className={navLinkClassName}
                >
                  {category.name}
                </NavLink>
              ))}
            </nav>
          </Container>
        </div>
      </header>

      <MobileMenu open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}
