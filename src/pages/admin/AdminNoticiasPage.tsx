import { Pencil, Plus, Send, Archive, FileEdit, Star, Flame } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ActionLink } from '@/components/common/ActionLink'
import { Container } from '@/components/common/Container'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { PageLoading } from '@/components/common/PageLoading'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { AdminToastProvider, useAdminToast } from '@/components/admin/AdminToast'
import { Seo } from '@/components/seo/Seo'
import { paths } from '@/routes/paths'
import {
  deleteArticle,
  fetchAdminArticles,
  setArticleStatus,
  updateArticle,
  type AdminArticleListOptions,
  type AdminArticleRow,
  type AdminArticleSortField,
  type SaveArticleInput,
} from '@/services/content'
import { fetchCategories } from '@/services/content/categories'
import type { CategoryRow } from '@/types'
import { fetchEditorialProfiles } from '@/services/content/articles'
import type { ArticleStatus } from '@/types'

const PAGE_SIZE = 10

interface AdminArticleFilters {
  readonly search: string
  readonly categoryId: string
  readonly authorId: string
  readonly status: ArticleStatus | ''
  readonly publishedFrom: string
  readonly publishedTo: string
}

const initialFilters: AdminArticleFilters = {
  search: '',
  categoryId: '',
  authorId: '',
  status: '',
  publishedFrom: '',
  publishedTo: '',
}

function toSaveInput(article: AdminArticleRow): SaveArticleInput {
  return {
    title: article.title,
    slug: article.slug,
    subtitle: article.subtitle,
    content: article.content,
    excerpt: article.excerpt,
    featuredImage: article.featuredImage,
    categoryId: article.category?.id ?? '',
    authorId: article.author?.id ?? '',
    status: article.status,
    isFeatured: article.isFeatured,
    isBreaking: article.isBreaking,
    publishedAt: article.publishedAt,
    tagIds: [],
  }
}

export default function AdminNoticiasPage() {
  const navigate = useNavigate()
  const { push } = useAdminToast()

  const [articles, setArticles] = useState<AdminArticleRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<AdminArticleFilters>(initialFilters)
  const [sortField, setSortField] = useState<AdminArticleSortField>('updated_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [offset, setOffset] = useState(0)

  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [authors, setAuthors] = useState<Array<{ id: string; fullName: string }>>([])

  const [articleToDelete, setArticleToDelete] = useState<AdminArticleRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetchCategories()
      .then((result) => {
        if (!cancelled) {
          setCategories(result)
        }
      })
      .catch(() => {
        // El selector de categoría se completa con las opciones disponibles.
      })

    fetchEditorialProfiles()
      .then((result) => {
        if (!cancelled) {
          setAuthors(result)
        }
      })
      .catch(() => {
        // Sin autores disponibles el filtro se omite.
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => ({ ...current, search: searchInput.trim() }))
      setOffset(0)
    }, 350)

    return () => {
      window.clearTimeout(timer)
    }
  }, [searchInput])

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setError(null)

    const options: AdminArticleListOptions = {
      limit: PAGE_SIZE,
      offset,
      sortField,
      sortDirection,
      search: filters.search,
      categoryId: filters.categoryId || null,
      authorId: filters.authorId || null,
      status: filters.status || null,
      publishedFrom: filters.publishedFrom || null,
      publishedTo: filters.publishedTo || null,
    }

    fetchAdminArticles(options)
      .then((result) => {
        if (!cancelled) {
          setArticles(result)
          setIsLoading(false)
        }
      })
      .catch((submitError) => {
        if (!cancelled) {
          setError(submitError instanceof Error ? submitError.message : 'No se pudo cargar noticias.')
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [filters, offset, sortField, sortDirection])

  function updateFilter(patch: Partial<AdminArticleFilters>): void {
    setFilters((current) => ({ ...current, ...patch }))
    setOffset(0)
  }

  function resetFilters(): void {
    setFilters(initialFilters)
    setSearchInput('')
    setOffset(0)
  }

  async function handleDelete(): Promise<void> {
    if (!articleToDelete) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteArticle(articleToDelete.id)
      push('success', 'La noticia se eliminó correctamente.')
      setArticleToDelete(null)
      setOffset(0)

      const options: AdminArticleListOptions = {
        limit: PAGE_SIZE,
        offset: 0,
        sortField,
        sortDirection,
        search: filters.search,
        categoryId: filters.categoryId || null,
        authorId: filters.authorId || null,
        status: filters.status || null,
        publishedFrom: filters.publishedFrom || null,
        publishedTo: filters.publishedTo || null,
      }

      const result = await fetchAdminArticles(options)
      setArticles(result)
    } catch (submitError) {
      push('error', submitError instanceof Error ? submitError.message : 'No se pudo eliminar la noticia.')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleStatusChange(article: AdminArticleRow, nextStatus: ArticleStatus): Promise<void> {
    try {
      await setArticleStatus(article.id, nextStatus)
      push('success', 'La noticia se actualizó correctamente.')

      const result = await fetchAdminArticles({
        limit: PAGE_SIZE,
        offset: 0,
        sortField,
        sortDirection,
        ...filters,
        status: filters.status || null,
        categoryId: filters.categoryId || null,
        authorId: filters.authorId || null,
        publishedFrom: filters.publishedFrom || null,
        publishedTo: filters.publishedTo || null,
      })

      setArticles(result)

    } catch (submitError) {
      push('error', submitError instanceof Error ? submitError.message : 'No se pudo actualizar la noticia.')
    }
  }

  async function handleToggleFlag(
    article: AdminArticleRow,
    flag: 'isFeatured' | 'isBreaking',
    nextValue: boolean,
  ): Promise<void> {
    const input = toSaveInput(article)
    const updatedInput: SaveArticleInput = { ...input, [flag]: nextValue }

    try {
      await updateArticle(article.id, updatedInput)
      push('success', flag === 'isFeatured' ? 'La noticia se marcó como destacada.' : 'La noticia se marcó como última hora.')

      const result = await fetchAdminArticles({
        limit: PAGE_SIZE,
        offset: 0,
        sortField,
        sortDirection,
        ...filters,
        status: filters.status || null,
        categoryId: filters.categoryId || null,
        authorId: filters.authorId || null,
        publishedFrom: filters.publishedFrom || null,
        publishedTo: filters.publishedTo || null,
      })

      setArticles(result)
    } catch (submitError) {
      push('error', submitError instanceof Error ? submitError.message : 'No se pudo actualizar la noticia.')
    }
  }

  const isFilterDirty =
    filters.search !== '' ||
    filters.categoryId !== '' ||
    filters.authorId !== '' ||
    filters.status !== '' ||
    filters.publishedFrom !== '' ||
    filters.publishedTo !== ''

  return (
    <>
      <Seo title="Noticias" path={paths.adminNoticias} noIndex />

      <PageHeader
        kicker="Contenido"
        title="Noticias"
        description="Gestiona el ciclo editorial completo: borradores, revisión, publicación, programación y archivo."
        breadcrumbs={[
          { label: 'Panel', to: paths.admin },
          { label: 'Noticias' },
        ]}
        children={
          <button
            type="button"
            onClick={() => navigate(paths.adminNoticiaNueva)}
            className="inline-flex items-center gap-2 bg-brand px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-brand-dark"
          >
            <Plus aria-hidden="true" size={15} strokeWidth={1.8} />
            Nueva noticia
          </button>
        }
      />

      <Container className="py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <section className="min-w-0 space-y-5">
            <div className="grid gap-4 border border-rule bg-paper-strong p-5 shadow-editorial sm:grid-cols-2 xl:grid-cols-6">
              <div className="sm:col-span-2">
                <label htmlFor="news-search" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  Búsqueda
                </label>
                <input
                  id="news-search"
                  type="search"
                  placeholder="Buscar por título…"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="mt-2 h-11 w-full border border-rule-strong bg-paper-strong px-3.5 text-sm text-ink placeholder:text-ink-muted/60 focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="news-category" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  Categoría
                </label>
                <select
                  id="news-category"
                  value={filters.categoryId}
                  onChange={(event) => updateFilter({ categoryId: event.target.value })}
                  className="mt-2 h-11 w-full border border-rule-strong bg-paper-strong px-3.5 text-sm text-ink focus:border-brand focus:outline-none"
                >
                  <option value="">Todas</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="news-author" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  Autor
                </label>
                <select
                  id="news-author"
                  value={filters.authorId}
                  onChange={(event) => updateFilter({ authorId: event.target.value })}
                  className="mt-2 h-11 w-full border border-rule-strong bg-paper-strong px-3.5 text-sm text-ink focus:border-brand focus:outline-none"
                >
                  <option value="">Todos</option>
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="news-status" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  Estado
                </label>
                <select
                  id="news-status"
                  value={filters.status}
                  onChange={(event) =>
                    updateFilter({ status: event.target.value as ArticleStatus | '' })
                  }
                  className="mt-2 h-11 w-full border border-rule-strong bg-paper-strong px-3.5 text-sm text-ink focus:border-brand focus:outline-none"
                >
                  <option value="">Todos</option>
                  <option value="draft">Borrador</option>
                  <option value="review">En revisión</option>
                  <option value="published">Publicada</option>
                  <option value="archived">Archivada</option>
                </select>
              </div>

              <div>
                <label htmlFor="news-published-from" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  Publicada desde
                </label>
                <input
                  id="news-published-from"
                  type="date"
                  value={filters.publishedFrom}
                  onChange={(event) => updateFilter({ publishedFrom: event.target.value })}
                  className="mt-2 h-11 w-full border border-rule-strong bg-paper-strong px-3.5 text-sm text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="news-published-to" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  Publicada hasta
                </label>
                <input
                  id="news-published-to"
                  type="date"
                  value={filters.publishedTo}
                  onChange={(event) => updateFilter({ publishedTo: event.target.value })}
                  className="mt-2 h-11 w-full border border-rule-strong bg-paper-strong px-3.5 text-sm text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="news-sort-field" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  Ordenar por
                </label>
                <select
                  id="news-sort-field"
                  value={sortField}
                  onChange={(event) => {
                    setSortField(event.target.value as AdminArticleSortField)
                    setOffset(0)
                  }}
                  className="mt-2 h-11 w-full border border-rule-strong bg-paper-strong px-3.5 text-sm text-ink focus:border-brand focus:outline-none"
                >
                  <option value="updated_at">Fecha de edición</option>
                  <option value="created_at">Fecha de creación</option>
                  <option value="published_at">Fecha de publicación</option>
                  <option value="title">Título</option>
                </select>
              </div>

              <div>
                <label htmlFor="news-sort-direction" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  Dirección
                </label>
                <select
                  id="news-sort-direction"
                  value={sortDirection}
                  onChange={(event) => setSortDirection(event.target.value as 'asc' | 'desc')}
                  className="mt-2 h-11 w-full border border-rule-strong bg-paper-strong px-3.5 text-sm text-ink focus:border-brand focus:outline-none"
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetFilters}
                disabled={!isFilterDirty}
                className="border border-rule-strong bg-paper-strong px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
              >
                Limpiar filtros
              </button>
              <p className="text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                {articles.length} resultado{articles.length === 1 ? '' : 's'}
              </p>
            </div>

            {error ? (
              <div role="alert" className="border border-brand/30 bg-brand-soft/70 p-4 text-xs text-ink">
                {error}
              </div>
            ) : null}

            {isLoading ? (
              <div className="border border-rule bg-paper-strong p-6">
                <PageLoading />
              </div>
            ) : (articles.length === 0) ? (
              <EmptyState
                title="No hay noticias para mostrar"
                description="Ajusta los filtros o crea una nueva noticia para comenzar el ciclo editorial."
                icon={FileEdit}
                action={
                  <button
                    type="button"
                    onClick={() => navigate(paths.adminNoticiaNueva)}
                    className="inline-flex items-center gap-2 bg-brand px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-brand-dark"
                  >
                    <Plus aria-hidden="true" size={15} strokeWidth={1.8} />
                    Crear noticia
                  </button>
                }
              />
            ) : (
              <div className="overflow-hidden border border-rule bg-paper-strong shadow-editorial">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-140 text-left text-sm">
                    <thead className="bg-night text-paper">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-paper/60">
                          Noticia
                        </th>
                        <th scope="col" className="px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-paper/60">
                          Categoría
                        </th>
                        <th scope="col" className="px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-paper/60">
                          Autor
                        </th>
                        <th scope="col" className="px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-paper/60">
                          Fechas
                        </th>
                        <th scope="col" className="px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-paper/60">
                          Estado
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-[9px] font-semibold uppercase tracking-[0.16em] text-paper/60">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule">
                      {articles.map((article) => (
                        <tr key={article.id} className="bg-paper-strong align-middle">
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() => navigate(paths.adminNoticiaEditar(article.id))}
                              className="group flex items-center gap-3 text-left"
                            >
                              {article.featuredImage ? (
                                <img
                                  src={article.featuredImage}
                                  alt={article.title}
                                  className="h-11 w-16 shrink-0 border border-rule object-cover"
                                />
                              ) : (
                                <span className="h-11 w-16 shrink-0 border border-rule bg-paper" />
                              )}
                              <span className="min-w-0">
                                <span className="block truncate font-serif text-base font-semibold text-ink">
                                  {article.title}
                                </span>
                                <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                                  {article.slug}
                                </span>
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-4 text-xs text-ink-muted">
                            {article.category?.name ?? 'Sin categoría'}
                          </td>
                          <td className="px-4 py-4 text-xs text-ink-muted">
                            {article.author?.fullName ?? 'Sin autor'}
                          </td>
                          <td className="px-4 py-4 text-xs text-ink-muted">
                            <span className="block">Creada: {article.createdAt ? new Date(article.createdAt).toLocaleDateString('es-SV') : '—'}</span>
                            <span className="mt-1 block">Publicada: {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('es-SV') : '—'}</span>
                          </td>
                          <td className="px-4 py-4">
                            <AdminStatusBadge status={article.status} />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(paths.adminNoticiaEditar(article.id))}
                                aria-label={`Editar ${article.title}`}
                                className="inline-flex h-9 w-9 items-center justify-center border border-rule-strong bg-paper-strong text-ink transition-colors hover:border-ink hover:bg-paper"
                              >
                                <Pencil aria-hidden="true" size={14} strokeWidth={1.8} />
                              </button>
                              {article.status !== 'published' ? (
                                <button
                                  type="button"
                                  onClick={() => void handleStatusChange(article, 'published')}
                                  className="inline-flex h-9 items-center gap-1.5 border border-brand/40 bg-brand-soft/50 px-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-dark transition-colors hover:bg-brand-soft"
                                >
                                  <Send aria-hidden="true" size={12} strokeWidth={1.8} />
                                  Publicar
                                </button>
                              ) : null}
                              {article.status !== 'draft' ? (
                                <button
                                  type="button"
                                  onClick={() => void handleStatusChange(article, 'draft')}
                                  className="inline-flex h-9 items-center gap-1.5 border border-rule-strong bg-paper-strong px-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink hover:bg-paper"
                                >
                                  <FileEdit aria-hidden="true" size={12} strokeWidth={1.8} />
                                  Borrador
                                </button>
                              ) : null}
                              {article.status === 'published' ? (
                                <button
                                  type="button"
                                  onClick={() => void handleStatusChange(article, 'archived')}
                                  className="inline-flex h-9 items-center gap-1.5 border border-rule-strong bg-paper-strong px-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink hover:bg-paper"
                                >
                                  <Archive aria-hidden="true" size={12} strokeWidth={1.8} />
                                  Archivar
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => void handleToggleFlag(article, 'isFeatured', !article.isFeatured)}
                                aria-label={article.isFeatured ? 'Quitar destacada' : 'Marcar destacada'}
                                className="inline-flex h-9 items-center gap-1.5 border border-rule-strong bg-paper-strong px-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink hover:bg-paper"
                              >
                                <Star aria-hidden="true" size={12} strokeWidth={1.8} className={article.isFeatured ? 'fill-brand text-brand' : ''} />
                                Destacada
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleToggleFlag(article, 'isBreaking', !article.isBreaking)}
                                aria-label={article.isBreaking ? 'Quitar última hora' : 'Marcar última hora'}
                                className="inline-flex h-9 items-center gap-1.5 border border-rule-strong bg-paper-strong px-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink hover:bg-paper"
                              >
                                <Flame aria-hidden="true" size={12} strokeWidth={1.8} />
                                Última hora
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {articles.length > 0 ? (
              <div className="flex items-center justify-between gap-3 border-t border-rule px-4 py-3">
                <button
                  type="button"
                  onClick={() => setOffset((current) => Math.max(current - PAGE_SIZE, 0))}
                  disabled={offset === 0}
                  className="border border-rule-strong bg-paper-strong px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <p className="text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                  Página {Math.floor(offset / PAGE_SIZE) + 1}
                </p>
                <button
                  type="button"
                  onClick={() => setOffset((current) => current + PAGE_SIZE)}
                  disabled={articles.length < PAGE_SIZE}
                  className="border border-rule-strong bg-paper-strong px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            ) : null}
          </section>

          <aside className="space-y-5">
            <div className="border border-rule bg-paper-strong p-5 shadow-editorial">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Resumen
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3 border-b border-rule pb-2">
                  <dt className="text-ink-muted">Total</dt>
                  <dd className="font-serif text-xl font-semibold text-ink">{articles.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-rule pb-2">
                  <dt className="text-ink-muted">Publicadas</dt>
                  <dd className="font-serif text-xl font-semibold text-ink">
                    {articles.filter((article) => article.status === 'published').length}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-rule pb-2">
                  <dt className="text-ink-muted">Borradores</dt>
                  <dd className="font-serif text-xl font-semibold text-ink">
                    {articles.filter((article) => article.status === 'draft').length}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-muted">En revisión</dt>
                  <dd className="font-serif text-xl font-semibold text-ink">
                    {articles.filter((article) => article.status === 'review').length}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border border-rule bg-paper-strong p-5 shadow-editorial">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Acceso rápido
              </p>
              <div className="mt-4 grid gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate(paths.adminNoticiaNueva)}
                  className="inline-flex items-center justify-center gap-2 bg-brand px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-brand-dark"
                >
                  <Plus aria-hidden="true" size={14} strokeWidth={1.8} />
                  Nueva noticia
                </button>
                <ActionLink to={paths.adminMultimedia}>Ir a multimedia</ActionLink>
                <ActionLink to={paths.adminCategorias}>Ir a categorías</ActionLink>
              </div>
            </div>
          </aside>
        </div>
      </Container>

      <AdminToastProvider>
        <ConfirmDialog
          isOpen={articleToDelete !== null}
          onClose={() => setArticleToDelete(null)}
          onConfirm={() => void handleDelete()}
          title="Eliminar noticia"
          message={
            <>
              Esta acción elimina la noticia <strong>{articleToDelete?.title}</strong> de forma
              permanente. El registro se conserva en auditoría. Esta operación no se puede deshacer.
            </>
          }
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          isSubmitting={isDeleting}
        />
      </AdminToastProvider>
    </>
  )
}
