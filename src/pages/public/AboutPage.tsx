import { ArrowRight, MapPin, Newspaper, ShieldCheck } from 'lucide-react'

import { ActionLink } from '@/components/common/ActionLink'
import { Container } from '@/components/common/Container'
import { ContentSection } from '@/components/common/ContentSection'
import { PageHeader } from '@/components/common/PageHeader'
import { NewsroomPrinciples } from '@/components/news/NewsroomPrinciples'
import { Seo } from '@/components/seo/Seo'
import { categories } from '@/config/categories'
import { paths } from '@/routes/paths'

export default function AboutPage() {
  return (
    <>
      <Seo
        title="Quiénes somos"
        description="Conoce el propósito, la cobertura y los principios editoriales de Prensa Metapán."
        path={paths.about}
      />

      <PageHeader
        kicker="El proyecto"
        title="Periodismo de Metapán, con la mirada puesta en todo El Salvador."
        description="Prensa Metapán es un proyecto editorial digital dedicado a la actualidad local, departamental y nacional."
        breadcrumbs={[
          { label: 'Inicio', to: paths.home },
          { label: 'Quiénes somos' },
        ]}
        aside={
          <div className="border border-rule bg-paper p-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              En síntesis
            </p>
            <dl className="mt-4 space-y-3 text-xs">
              <div>
                <dt className="font-semibold text-ink">Ubicación</dt>
                <dd className="mt-0.5 text-ink-muted">Metapán, Santa Ana, El Salvador</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Cobertura</dt>
                <dd className="mt-0.5 text-ink-muted">Local, departamental y nacional</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Formato</dt>
                <dd className="mt-0.5 text-ink-muted">Periódico digital</dd>
              </div>
            </dl>
          </div>
        }
      />

      <section aria-label="Propósito y cobertura del proyecto">
        <Container className="grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16 lg:py-16">
          <div className="space-y-10">
            <ContentSection title="Por qué existimos">
              <p>
                Metapán y su gente merecen información que explique lo que ocurre, no solo que lo
                anuncie. Este portal nace para documentar la vida pública de la comunidad, con
                especial atención a los temas que afectan la vida cotidiana.
              </p>
              <p>
                La cobertura se extiende al departamento de Santa Ana y al resto de El Salvador
                cuando los hechos tienen impacto en la región o cuando el contexto nacional ayuda a
                entender la realidad local.
              </p>
            </ContentSection>

            <blockquote className="border-l-4 border-brand py-1 pl-5">
              <p className="font-serif text-2xl font-medium italic leading-snug tracking-[-0.02em] text-ink sm:text-3xl">
                “No publicamos rumores como noticias ni datos ficticios como información real.”
              </p>
              <footer className="mt-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Principio editorial
              </footer>
            </blockquote>

            <section aria-labelledby="cobertura-title">
              <div className="flex items-center gap-2">
                <Newspaper
                  aria-hidden="true"
                  size={18}
                  strokeWidth={1.6}
                  className="text-brand"
                />
                <h2
                  id="cobertura-title"
                  className="font-serif text-2xl font-semibold tracking-[-0.02em]"
                >
                  Lo que cubriremos
                </h2>
              </div>

              <div className="mt-5 grid gap-px border border-rule bg-rule sm:grid-cols-2">
                {categories.map((category) => (
                  <div key={category.slug} className="bg-paper-strong p-4">
                    <h3 className="font-serif text-lg font-semibold">{category.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                      {category.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <ContentSection title="El portal y la redacción">
              <p>
                Prensa Metapán reúne un portal público y herramientas editoriales para organizar
                noticias, categorías, multimedia, comentarios, transmisiones y publicidad.
              </p>
              <p>
                Cada nota pasa por revisión editorial antes de publicarse. No mostramos contenido
                de demostración como si fuera información real.
              </p>
            </ContentSection>
          </div>

          <aside className="space-y-8 self-start">
            <div className="border-t-2 border-ink pt-4">
              <h2 className="font-serif text-xl font-semibold tracking-[-0.02em]">
                Nuestra ubicación
              </h2>
              <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-ink-muted">
                <MapPin
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.6}
                  className="mt-0.5 shrink-0 text-brand"
                />
                Metapán, departamento de Santa Ana, El Salvador.
              </p>
            </div>

            <div className="border border-rule bg-paper-strong p-5">
              <ShieldCheck
                aria-hidden="true"
                size={20}
                strokeWidth={1.6}
                className="text-brand"
              />
              <h2 className="mt-3 font-serif text-lg font-semibold">Transparencia</h2>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                Los principios editoriales y las reglas de publicación están disponibles para que
                los lectores conozcan nuestros criterios.
              </p>
              <ActionLink to={paths.editorialPolicy} variant="secondary" className="mt-4 w-full">
                Política editorial
              </ActionLink>
            </div>

            <div className="border-t border-rule pt-4">
              <h2 className="font-serif text-xl font-semibold tracking-[-0.02em]">Contacto</h2>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                Puedes contactar a la redacción por WhatsApp, correo electrónico o Facebook.
              </p>
              <ActionLink
                to={paths.contact}
                variant="secondary"
                icon={ArrowRight}
                className="mt-4 w-full"
              >
                Ver canales
              </ActionLink>
            </div>
          </aside>
        </Container>
      </section>

      <section className="bg-night text-paper" aria-labelledby="principios-proyecto-title">
        <Container className="py-12 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-light">
                Principios
              </p>
              <h2
                id="principios-proyecto-title"
                className="mt-3 font-serif text-4xl font-semibold leading-[1.05] tracking-[-0.03em]"
              >
                Cómo entendemos el periodismo local.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                La credibilidad se construye con métodos visibles: fuentes, contexto, corrección y
                separación clara entre información y opinión.
              </p>
            </div>

            <NewsroomPrinciples tone="dark" />
          </div>
        </Container>
      </section>

    </>
  )
}
