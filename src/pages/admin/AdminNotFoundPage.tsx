import { ArrowLeft } from 'lucide-react'

import { ActionLink } from '@/components/common/ActionLink'
import { Container } from '@/components/common/Container'
import { Seo } from '@/components/seo/Seo'
import { paths } from '@/routes/paths'

export default function AdminNotFoundPage() {
  return (
    <>
      <Seo title="Página no encontrada" path={paths.admin} noIndex />

      <Container className="flex min-h-[55vh] flex-col items-center justify-center py-16 text-center">
        <p aria-hidden="true" className="font-serif text-6xl leading-none text-rule-strong">
          404
        </p>
        <h1 className="mt-4 font-serif text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
          Esta ruta del panel no existe.
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
          El panel administrativo todavía no tiene módulos internos. Vuelve a la pantalla principal
          del panel.
        </p>
        <ActionLink to={paths.admin} variant="secondary" icon={ArrowLeft} className="mt-7">
          Volver al panel
        </ActionLink>
      </Container>
    </>
  )
}
