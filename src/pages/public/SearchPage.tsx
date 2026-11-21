import { zodResolver } from '@hookform/resolvers/zod'
import { Search, SearchX } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { useEffect, useState } from 'react'

import { ActionLink } from '@/components/common/ActionLink'
import { Container } from '@/components/common/Container'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { Seo } from '@/components/seo/Seo'
import { paths } from '@/routes/paths'
import { ArticleCard } from '@/components/news/ArticleCard'
import { PageLoading } from '@/components/common/PageLoading'
import { searchPublishedArticles, type PublishedArticleSummary } from '@/services/content/articles'

const PAGE_SIZE = 12

const searchFormSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, 'Escribe al menos 2 caracteres.')
    .max(100, 'Usa 100 caracteres o menos.'),
})

type SearchFormValues = z.infer<typeof searchFormSchema>

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const submittedQuery = (searchParams.get('q') ?? '').trim()
  const [results, setResults] = useState<PublishedArticleSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    if (submittedQuery.length < 2) { setResults([]); return }
    let active = true
    setLoading(true)
    setSearchError(null)
    const debounce = window.setTimeout(() => { searchPublishedArticles(submittedQuery, PAGE_SIZE, offset).then((items) => {
      if (active) {
        setHasMore(items.length > PAGE_SIZE)
        setResults((current) => offset === 0 ? items.slice(0, PAGE_SIZE) : [...current, ...items.slice(0, PAGE_SIZE)])
      }
    })
      .catch((error: unknown) => { if (active) setSearchError(error instanceof Error ? error.message : 'No se pudo completar la búsqueda.') })
      .finally(() => { if (active) setLoading(false) }) }, 250)
    return () => { active = false; window.clearTimeout(debounce) }
  }, [submittedQuery, offset])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: { query: submittedQuery },
  })

  const handleSearch = (values: SearchFormValues) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('q', values.query)
    setOffset(0)
    setResults([])
    setSearchParams(nextParams)
  }

  return (
    <>
      <Seo
        title="Buscar"
        description="Busca noticias de Metapán, Santa Ana y El Salvador en Prensa Metapán."
        path={paths.search}
        noIndex
      />

      <PageHeader
        kicker="Búsqueda"
        title="Encuentra una noticia"
        description="La búsqueda recorrerá únicamente contenido editorial publicado y verificado."
        breadcrumbs={[
          { label: 'Inicio', to: paths.home },
          { label: 'Buscar' },
        ]}
        aside={
          <div className="border-l-2 border-rule-strong pl-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              Estado del archivo
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              Búsqueda en noticias publicadas, categorías y etiquetas.
            </p>
          </div>
        }
      />

      <section>
        <Container className="max-w-4xl py-12 lg:py-16">
          <form onSubmit={handleSubmit(handleSearch)} noValidate>
            <label htmlFor="search-query" className="sr-only">
              Buscar noticias
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    size={18}
                    strokeWidth={1.7}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
                  />
                  <input
                    id="search-query"
                    type="search"
                    autoComplete="off"
                    placeholder="Palabra clave, lugar o tema"
                    aria-invalid={Boolean(errors.query)}
                    aria-describedby={errors.query ? 'search-query-error' : undefined}
                    className="h-13 w-full border border-rule-strong bg-paper-strong py-3 pl-11 pr-4 text-sm text-ink placeholder:text-ink-muted/70 focus:border-ink focus:outline-none"
                    {...register('query')}
                  />
                </div>

                {errors.query && (
                  <p id="search-query-error" role="alert" className="mt-2 text-xs text-brand">
                    {errors.query.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="inline-flex h-13 items-center justify-center gap-2 bg-brand px-7 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-brand-dark"
              >
                Buscar
                <Search aria-hidden="true" size={15} strokeWidth={1.8} />
              </button>
            </div>
          </form>

          <div className="mt-10">
            {submittedQuery ? (
              <>
                <div className="border-b border-rule pb-3">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                    Resultado de búsqueda
                  </p>
                  <p className="mt-1 font-serif text-2xl font-semibold">“{submittedQuery}”</p>
                </div>

                {loading ? <div className="mt-8"><PageLoading /></div> : searchError ? <p role="alert" className="mt-8 border border-brand/30 bg-brand-soft/70 p-4 text-sm">{searchError}</p> : results.length ? <><div className="mt-7 grid gap-8 sm:grid-cols-2">{results.map((article) => <ArticleCard key={article.id} article={article} />)}</div>{hasMore ? <button type="button" onClick={() => setOffset((value) => value + PAGE_SIZE)} disabled={loading} className="mt-8 border border-rule-strong px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] disabled:opacity-50">Cargar más</button> : null}</> : <EmptyState
                  className="mt-8"
                  icon={SearchX}
                  eyebrow="Sin resultados"
                  title="El archivo todavía está vacío"
                  description={`No hay noticias publicadas que coincidan con “${submittedQuery}”. La búsqueda estará disponible cuando el archivo editorial tenga contenido.`}
                  action={
                    <ActionLink to={paths.news} variant="secondary">
                      Ir al archivo de noticias
                    </ActionLink>
                  }
                />}
              </>
            ) : (
              <div className="border border-rule bg-paper-strong p-6 sm:p-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
                  Búsqueda en preparación
                </p>
                <h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.02em]">
                  El archivo editorial aún no está disponible.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
                  Escribe al menos dos caracteres para buscar en títulos, contenido, categorías y etiquetas.
                </p>
                <Link
                  to={paths.news}
                  className="mt-5 inline-block text-[10px] font-semibold uppercase tracking-[0.15em] text-ink underline decoration-rule-strong underline-offset-4 transition-colors hover:text-brand"
                >
                  Explorar secciones
                </Link>
              </div>
            )}
          </div>
        </Container>
      </section>
    </>
  )
}
