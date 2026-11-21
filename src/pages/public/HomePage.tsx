import { ArrowRight, ArrowUpRight, Newspaper, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { ActionLink } from '@/components/common/ActionLink'
import { Container } from '@/components/common/Container'
import { EmptyState } from '@/components/common/EmptyState'
import { SectionHeading } from '@/components/common/SectionHeading'
import { NewsroomPrinciples } from '@/components/news/NewsroomPrinciples'
import { Seo } from '@/components/seo/Seo'
import { categories } from '@/config/categories'
import { paths } from '@/routes/paths'
import { fetchPublishedArticles, type PublishedArticleSummary } from '@/services/content/articles'
import { ArticleCard } from '@/components/news/ArticleCard'
import { PageLoading } from '@/components/common/PageLoading'
import { FacebookLiveSection } from '@/components/news/FacebookLiveSection'
import { AdSlot } from '@/components/ads/AdSlot'
import { StructuredData } from '@/components/seo/Seo'
import { siteConfig } from '@/config/site'

const editionSections = categories.slice(0, 5)

export default function HomePage() {
  const [articles, setArticles] = useState<PublishedArticleSummary[]>([])
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [articleError, setArticleError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchPublishedArticles({ limit: 8 }).then((result) => { if (active) setArticles(result) })
      .catch((error: unknown) => { if (active) setArticleError(error instanceof Error ? error.message : 'No se pudieron cargar las noticias.') })
      .finally(() => { if (active) setLoadingArticles(false) })
    return () => { active = false }
  }, [])

  return (
    <>
      <Seo
        title="Inicio"
        description="Prensa Metapán: periodismo local de Metapán, Santa Ana y El Salvador. Información con contexto, verificación y servicio público."
        path={paths.home}
      />
      <StructuredData data={{ '@context': 'https://schema.org', '@type': 'Organization', name: siteConfig.name, url: siteConfig.url ?? window.location.origin, areaServed: siteConfig.location }} />
      <StructuredData data={{ '@context': 'https://schema.org', '@type': 'WebSite', name: siteConfig.name, url: siteConfig.url ?? window.location.origin, inLanguage: 'es-SV', potentialAction: { '@type': 'SearchAction', target: `${siteConfig.url ?? window.location.origin}${paths.search}?q={search_term_string}`, 'query-input': 'required name=search_term_string' } }} />

      <section className="border-b border-rule bg-paper-strong">
        <Container className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.65fr)] lg:gap-14 lg:py-16">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-brand" aria-hidden="true" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
                Metapán · Santa Ana · El Salvador
              </p>
            </div>

            <h1 className="mt-6 max-w-4xl font-serif text-[2.75rem] font-semibold leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              La actualidad de Metapán, con la mirada puesta en El Salvador.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
              Un periódico digital para entender lo que ocurre en la comunidad, el departamento y el
              país. Información con contexto, fuentes y responsabilidad editorial.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ActionLink to={paths.news} icon={ArrowRight}>
                Explorar noticias
              </ActionLink>
              <ActionLink to={paths.about} variant="secondary">
                Conocer el proyecto
              </ActionLink>
            </div>

            <div className="mt-9 flex max-w-2xl items-start gap-3 border-t border-rule pt-5">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink">
                  {articles.length ? 'Edicion en curso' : 'Primera edicion en preparacion'}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  {articles.length ? 'Hay noticias publicadas recientemente.' : 'Aun no hay noticias publicadas. No mostramos contenido de ejemplo como si fuera informacion real.'}
                </p>
              </div>
            </div>
          </div>

          <aside className="self-center border border-rule bg-paper p-5 shadow-editorial sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-rule pb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink">
                En esta edición
              </p>
              <span className="text-[9px] uppercase tracking-[0.16em] text-ink-muted">Secciones</span>
            </div>

            <ul className="divide-y divide-rule">
              {editionSections.map((category, index) => (
                <li key={category.slug}>
                  <Link
                    to={paths.category(category.slug)}
                    className="group flex items-center gap-4 py-3.5"
                  >
                    <span
                      aria-hidden="true"
                      className="font-serif text-xs tabular-nums text-rule-strong"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-serif text-lg font-medium leading-tight transition-colors group-hover:text-brand">
                        {category.name}
                      </span>
                      <span className="mt-0.5 block text-[9px] uppercase tracking-[0.14em] text-ink-muted">
                        Explorar seccion
                      </span>
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      size={15}
                      strokeWidth={1.6}
                      className="shrink-0 text-ink-muted transition-colors group-hover:text-brand"
                    />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t border-rule pt-4">
              <p className="flex items-start gap-2.5 text-[11px] leading-relaxed text-ink-muted">
                <ShieldCheck
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.6}
                  className="mt-0.5 shrink-0 text-brand"
                />
                La cobertura comenzará cuando el proceso editorial esté habilitado.
              </p>
              <Link
                to={paths.news}
                className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:text-brand"
              >
                Ver todas las secciones
                <ArrowRight aria-hidden="true" size={13} strokeWidth={1.8} />
              </Link>
            </div>
          </aside>
        </Container>
      </section>

      <FacebookLiveSection />
      <div className="px-4 py-4"><AdSlot placement="home_banner" /></div>

      <section className="border-b border-rule" aria-labelledby="ultimas-noticias">
        <Container className="py-12 lg:py-16">
          <SectionHeading
            titleId="ultimas-noticias"
            kicker="Cobertura"
            title="Últimas noticias"
            description={articles.length ? "Publicaciones recientes de la redaccion." : "El archivo editorial se activara con la primera cobertura verificada."}
            action={
              <Link
                to={paths.news}
                className="group inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink transition-colors hover:text-brand"
              >
                Ver archivo
                <ArrowRight
                  aria-hidden="true"
                  size={14}
                  strokeWidth={1.8}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            }
          />

          {loadingArticles ? <div className="mt-8"><PageLoading /></div> : articleError ? <p role="alert" className="mt-8 border border-brand/30 bg-brand-soft/70 p-4 text-sm">{articleError}</p> : articles.length ? <>
            {(() => { const lead = articles.find((article) => article.isFeatured) ?? articles[0]; if (!lead) return null; const secondary = articles.filter((article) => article.id !== lead.id).slice(0, 3); return <>
              <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <Link to={paths.article(lead.slug)} className="group border border-rule bg-paper-strong">
                  {lead.featuredImage ? <img src={lead.featuredImage} alt={lead.featuredImageAlt || lead.title} loading="eager" fetchPriority="high" decoding="async" sizes="(min-width:1024px) 60vw, 100vw" className="aspect-[16/8] w-full object-cover" /> : <div className="aspect-[16/8] bg-paper" />}
                  <div className="p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">{lead.isFeatured ? 'Noticia destacada' : 'Portada'}{lead.category ? ` · ${lead.category.name}` : ''}</p><h3 className="mt-2 font-serif text-3xl font-semibold leading-tight group-hover:text-brand">{lead.title}</h3>{lead.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-muted">{lead.excerpt}</p>}</div>
                </Link>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">{secondary.map((article) => <ArticleCard key={article.id} article={article} />)}</div>
              </div>
              {articles.length > 4 && <div className="mt-9 grid gap-x-6 gap-y-9 sm:grid-cols-2 xl:grid-cols-4">{articles.slice(4).map((article) => <ArticleCard key={article.id} article={article} />)}</div>}
            </> })()}
          </> : <EmptyState
            className="mt-8"
            icon={Newspaper}
            eyebrow="Archivo vacío"
            title="La primera edición está en preparación"
            description="Todavía no se ha publicado ninguna noticia. Este espacio se activará cuando la redacción inicie la cobertura y el flujo editorial esté validado."
            action={
              <ActionLink to={paths.about} variant="secondary">
                Conocer el proyecto
              </ActionLink>
            }
          />}
        </Container>
      </section>

      <section
        id="secciones"
        className="scroll-mt-24 border-b border-rule bg-paper-strong"
        aria-labelledby="secciones-title"
      >
        <Container className="py-12 lg:py-16">
          <SectionHeading
            titleId="secciones-title"
            kicker="Guía del portal"
            title="Nuestras secciones"
            description="La cobertura estará organizada por territorio y temas para facilitar la lectura."
          />

          <div className="mt-8 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => (
              <Link
                key={category.slug}
                to={paths.category(category.slug)}
                className="group flex min-h-52 flex-col justify-between bg-paper-strong p-5 transition-colors hover:bg-paper"
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    aria-hidden="true"
                    className="font-serif text-sm tabular-nums text-rule-strong"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    size={16}
                    strokeWidth={1.6}
                    className="text-ink-muted transition-colors group-hover:text-brand"
                  />
                </div>
                <div className="mt-8">
                  <h3 className="font-serif text-2xl font-semibold tracking-[-0.02em] transition-colors group-hover:text-brand">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                    {category.description}
                  </p>
                  <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-brand">
                    Ver sección
                  </p>
                </div>
              </Link>
            ))}

            <Link
              to={paths.news}
              className="group flex min-h-52 flex-col justify-between bg-ink p-5 text-paper transition-colors hover:bg-night-soft"
            >
              <Newspaper
                aria-hidden="true"
                size={22}
                strokeWidth={1.5}
                className="text-brand-light"
              />
              <div className="mt-8">
                <h3 className="font-serif text-2xl font-semibold tracking-[-0.02em]">
                  Todas las noticias
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-white/55">
                  Consulta el archivo completo cuando inicie la cobertura.
                </p>
                <p className="mt-4 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-light">
                  Ir al archivo
                  <ArrowRight
                    aria-hidden="true"
                    size={12}
                    strokeWidth={1.8}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </p>
              </div>
            </Link>
          </div>
        </Container>
      </section>

      <section
        className="border-b border-rule bg-night text-paper"
        aria-labelledby="compromiso-title"
      >
        <Container className="py-12 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-light">
                Nuestro compromiso
              </p>
              <h2
                id="compromiso-title"
                className="mt-3 font-serif text-4xl font-semibold leading-[1.05] tracking-[-0.03em]"
              >
                Información útil, verificada y con contexto.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
                Estos principios guían cada decisión editorial y serán públicos para nuestros
                lectores desde el primer día de cobertura.
              </p>
              <Link
                to={paths.editorialPolicy}
                className="mt-6 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-light transition-colors hover:text-paper"
              >
                Leer la política editorial
                <ArrowRight aria-hidden="true" size={14} strokeWidth={1.8} />
              </Link>
            </div>

            <NewsroomPrinciples limit={3} tone="dark" />
          </div>
        </Container>
      </section>

      <section className="bg-paper-strong" aria-labelledby="contacto-cta-title">
        <Container className="flex flex-col gap-6 py-12 md:flex-row md:items-center md:justify-between lg:py-16">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
              Participa
            </p>
            <h2
              id="contacto-cta-title"
              className="mt-2 font-serif text-3xl font-semibold tracking-[-0.025em] sm:text-4xl"
            >
              ¿Tienes información de interés público?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Los canales oficiales para contactar a la redacción se habilitarán antes del
              lanzamiento. No publicaremos datos de contacto sin verificarlos.
            </p>
          </div>

          <ActionLink to={paths.contact} variant="secondary" icon={ArrowUpRight}>
            Ver canales de contacto
          </ActionLink>
        </Container>
      </section>
    </>
  )
}
