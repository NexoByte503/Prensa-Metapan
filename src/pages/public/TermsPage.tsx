import { Container } from '@/components/common/Container'
import { ContentSection } from '@/components/common/ContentSection'
import { PageHeader } from '@/components/common/PageHeader'
import { Seo } from '@/components/seo/Seo'
import { paths } from '@/routes/paths'

export default function TermsPage() {
  return (
    <>
      <Seo
        title="Términos de uso"
        description="Condiciones preliminares de uso del portal Prensa Metapán."
        path={paths.terms}
      />

      <PageHeader
        kicker="Legal"
        title="Términos de uso"
        description="Condiciones generales para el uso del portal Prensa Metapán."
        breadcrumbs={[
          { label: 'Inicio', to: paths.home },
          { label: 'Términos de uso' },
        ]}
      />

      <section>
        <Container className="max-w-3xl space-y-9 py-12 lg:py-16">
          <div className="border border-rule bg-brand-soft/60 p-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-brand">
              Versión preliminar
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Este documento es una versión preliminar y debe revisarse con los datos de la entidad
              responsable y las condiciones legales aplicables antes del lanzamiento editorial.
            </p>
          </div>

          <ContentSection title="Estado del servicio">
            <p>
              Prensa Metapán ofrece un portal informativo y herramientas para la gestión editorial.
              Las funciones disponibles pueden variar según la configuración del servicio.
            </p>
            <p>
              El servicio puede cambiar, interrumpirse o reiniciarse sin previo aviso.
            </p>
          </ContentSection>

          <ContentSection title="Naturaleza de la información">
            <p>
              Los textos institucionales describen el proyecto y sus principios editoriales. No
              deben interpretarse como noticias ni como asesoría legal, financiera o de otro tipo.
              Cuando se publiquen noticias, se identificarán como tales y se indicará su fecha.
            </p>
          </ContentSection>

          <ContentSection title="Propiedad intelectual">
            <p>
              El nombre, el diseño y los textos propios de Prensa Metapán están protegidos por la
              legislación aplicable. No se autoriza su reproducción comercial sin permiso previo.
            </p>
            <p>
              Las obras de terceros, imágenes y documentos se utilizarán con autorización o bajo los
              supuestos permitidos por la ley, y se atribuirán cuando corresponda.
            </p>
          </ContentSection>

          <ContentSection title="Uso aceptable">
            <p>Al utilizar el portal te comprometes a no:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Intentar acceder a áreas restringidas sin autorización.</li>
              <li>Interrumpir o afectar la seguridad del servicio.</li>
              <li>Utilizar el contenido para suplantar la identidad del medio o de terceros.</li>
              <li>Publicar o distribuir material ilícito mediante canales del portal.</li>
            </ul>
          </ContentSection>

          <ContentSection title="Enlaces externos">
            <p>
              El portal podrá incluir enlaces a sitios de terceros. Prensa Metapán no controla su
              contenido ni sus políticas, y no asume responsabilidad por ellos.
            </p>
          </ContentSection>

          <ContentSection title="Limitaciones">
            <p>
              El portal se ofrece en su estado actual, sin garantías de disponibilidad continua ni
              de ausencia de errores. Las limitaciones definitivas se establecerán en la versión
              aprobada de estos términos.
            </p>
          </ContentSection>

          <ContentSection title="Cambios">
            <p>
              Los cambios a estos términos se publicarán en esta página. El uso del portal después
              de una actualización implica la aceptación de la versión vigente.
            </p>
          </ContentSection>
        </Container>
      </section>
    </>
  )
}
