import { ActionLink } from '@/components/common/ActionLink'
import { Container } from '@/components/common/Container'
import { ContentSection } from '@/components/common/ContentSection'
import { PageHeader } from '@/components/common/PageHeader'
import { NewsroomPrinciples } from '@/components/news/NewsroomPrinciples'
import { Seo } from '@/components/seo/Seo'
import { paths } from '@/routes/paths'

const policySections = [
  { id: 'principios', label: 'Principios' },
  { id: 'fuentes', label: 'Fuentes y verificación' },
  { id: 'informacion-opinion', label: 'Información y opinión' },
  { id: 'correcciones', label: 'Correcciones' },
  { id: 'independencia', label: 'Independencia' },
  { id: 'tecnologia', label: 'Tecnología' },
  { id: 'vigencia', label: 'Vigencia' },
] as const

export default function EditorialPolicyPage() {
  return (
    <>
      <Seo
        title="Política editorial"
        description="Principios de verificación, corrección, independencia y transparencia de Prensa Metapán."
        path={paths.editorialPolicy}
      />

      <PageHeader
        kicker="Transparencia"
        title="Política editorial"
        description="Los criterios que orientarán la cobertura y la relación de Prensa Metapán con sus lectores y sus fuentes."
        breadcrumbs={[
          { label: 'Inicio', to: paths.home },
          { label: 'Política editorial' },
        ]}
      />

      <section>
        <Container className="grid gap-12 py-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16 lg:py-16">
          <aside className="self-start lg:sticky lg:top-8">
            <div className="border-t-2 border-ink pt-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                En esta página
              </p>
              <nav aria-label="Contenido de la política editorial" className="mt-3">
                <ol className="space-y-2">
                  {policySections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="text-xs text-ink-muted transition-colors hover:text-brand"
                      >
                        {section.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </aside>

          <div className="max-w-3xl space-y-9">
            <div className="border border-rule bg-brand-soft/60 p-5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-brand">
                Versión preliminar
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Este documento es una base de trabajo y será revisado antes del lanzamiento
                editorial. No constituye todavía una política definitiva aprobada por la dirección
                del proyecto.
              </p>
            </div>

            <section id="principios" className="scroll-mt-24">
              <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em]">
                Principios que orientan la cobertura
              </h2>
              <NewsroomPrinciples className="mt-5" />
            </section>

            <ContentSection title="Fuentes y verificación" id="fuentes">
              <p>
                Antes de publicar, contrastamos los datos relevantes con fuentes identificables.
                Cuando una fuente solicita reserva, explicamos al lector el motivo y el alcance de
                esa protección.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Distinguimos entre hechos confirmados, versiones y opiniones.</li>
                <li>Evitamos presentar rumores o capturas sin verificar como noticias.</li>
                <li>
                  Identificamos los documentos y las autoridades consultadas siempre que sea
                  posible.
                </li>
              </ul>
            </ContentSection>

            <ContentSection title="Información y opinión" id="informacion-opinion">
              <p>
                La información responde a hechos verificables. La opinión analiza esos hechos desde
                una perspectiva identificada y no se presenta como cobertura informativa.
              </p>
              <p>
                Las columnas y análisis se marcarán como opinión y se mantendrán separados de las
                noticias en la navegación y en la presentación visual.
              </p>
            </ContentSection>

            <ContentSection title="Correcciones y derecho de respuesta" id="correcciones">
              <p>
                Cuando detectamos un error, lo corregimos de forma visible y explicamos qué cambió.
                Las correcciones no se eliminan ni se ocultan.
              </p>
              <p>
                Toda persona o institución mencionada en una nota podrá solicitar una aclaración
                cuando los canales de contacto estén habilitados. La solicitud será evaluada con
                base en la evidencia disponible.
              </p>
            </ContentSection>

            <ContentSection title="Independencia y conflictos de interés" id="independencia">
              <p>
                Ningún interés comercial, político o personal debe determinar el contenido de una
                nota. Cuando exista un vínculo que pueda percibirse como conflicto, se informará al
                lector.
              </p>
              <p>
                La publicidad, cuando exista, se identificará de forma clara y no se presentará como
                contenido editorial.
              </p>
            </ContentSection>

            <ContentSection title="Tecnología y asistencia editorial" id="tecnologia">
              <p>
                Las herramientas tecnológicas pueden asistir tareas de organización, transcripción o
                revisión. No sustituyen la verificación, el juicio editorial ni la responsabilidad
                sobre lo publicado.
              </p>
              <p>
                Ningún contenido se publicará como noticia sin revisión humana y contraste de
                fuentes.
              </p>
            </ContentSection>

            <ContentSection title="Vigencia y revisión" id="vigencia">
              <p>
                Esta política se actualizará cuando se definan los responsables editoriales, los
                canales oficiales y los procedimientos de publicación. La versión vigente será
                siempre la publicada en esta página.
              </p>
            </ContentSection>

            <div className="border-t border-rule pt-6">
              <ActionLink to={paths.contact} variant="secondary">
                Consultar canales de contacto
              </ActionLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
