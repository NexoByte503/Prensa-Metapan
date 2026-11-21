import { ArrowRight } from 'lucide-react'

import { ActionLink } from '@/components/common/ActionLink'
import { Container } from '@/components/common/Container'
import { Seo } from '@/components/seo/Seo'
import { paths } from '@/routes/paths'

export default function NotFoundPage() {
  return (
    <>
      <Seo title="Página no encontrada" path={paths.home} noIndex />

      <section className="bg-paper-strong">
        <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
          <p aria-hidden="true" className="font-serif text-[7rem] leading-none text-rule-strong">
            404
          </p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
            Página no encontrada
          </p>
          <h1 className="mt-3 max-w-xl font-serif text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
            No pudimos encontrar esta página.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
            Puede que el enlace esté mal escrito o que el contenido todavía no esté disponible. No
            mostramos páginas de ejemplo para reemplazar la dirección solicitada.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ActionLink to={paths.home} icon={ArrowRight}>
              Ir al inicio
            </ActionLink>
            <ActionLink to={paths.search} variant="secondary">
              Buscar una noticia
            </ActionLink>
          </div>
        </Container>
      </section>
    </>
  )
}
