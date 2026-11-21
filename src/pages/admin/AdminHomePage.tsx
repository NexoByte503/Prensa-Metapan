import { useEffect, useState } from 'react'
import { Archive, FileEdit, MessageSquare, Newspaper, Plus, Send, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AdminBarChart } from '@/components/admin/AdminBarChart'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { Container } from '@/components/common/Container'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoading } from '@/components/common/PageLoading'
import { useAdminToast } from '@/components/admin/AdminToast'
import { Seo } from '@/components/seo/Seo'
import { useAuth } from '@/hooks'
import { paths } from '@/routes/paths'
import { fetchDashboardData, type DashboardData } from '@/services/analytics'

const cardClass = 'border border-rule bg-paper-strong p-5 shadow-editorial'

export default function AdminHomePage() {
  const { profile } = useAuth()
  const { push } = useAdminToast()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchDashboardData().then((value) => {
      if (active) setData(value)
    }).catch((cause: unknown) => {
      const message = cause instanceof Error ? cause.message : 'No se pudo cargar el panel.'
      if (active) {
        setError(message)
        push('error', message)
      }
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [push])

  return (
    <>
      <Seo title="Panel editorial" path={paths.admin} noIndex />
      <Container className="space-y-8 py-8 lg:py-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">Panel editorial</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[-0.03em]">Buen día, {profile?.full_name ?? 'equipo'}</h1>
            <p className="mt-2 text-sm text-ink-muted">Resumen actualizado desde la base de datos editorial.</p>
          </div>
          <Link to={paths.adminNoticiaNueva} className="inline-flex items-center gap-2 bg-brand px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white hover:bg-brand-dark">
            <Plus aria-hidden="true" size={15} /> Nueva noticia
          </Link>
        </header>

        {loading ? <div className={cardClass}><PageLoading /></div> : error ? (
          <div role="alert" className="border border-brand/30 bg-brand-soft/70 p-4 text-sm text-ink">{error}</div>
        ) : data ? <>
          <section aria-label="Estadísticas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AdminStatCard label="Total de noticias" value={data.total} icon={Newspaper} />
            <AdminStatCard label="Publicadas" value={data.published} icon={Send} tone="brand" />
            <AdminStatCard label="En borrador" value={data.drafts} icon={FileEdit} />
            <AdminStatCard label="Pendientes de revisión" value={data.review} icon={Archive} tone="muted" />
            <AdminStatCard label="Comentarios pendientes" value={data.pendingComments ?? '—'} icon={MessageSquare} hint={data.pendingComments === null ? 'Solo disponible para administradores' : 'Requieren moderación'} />
            <AdminStatCard label="Visitas registradas" value={data.visits ?? '—'} icon={Eye} hint={data.visits === null ? 'Solo disponible para administradores' : 'Total acumulado'} />
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
            <section className={cardClass}>
              <div className="flex items-center justify-between gap-3">
                <div><h2 className="font-serif text-xl font-semibold">Noticias recientes</h2><p className="mt-1 text-xs text-ink-muted">Últimos cambios editoriales</p></div>
                <Link to={paths.adminNoticias} className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand">Ver todas</Link>
              </div>
              {data.recentArticles.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-140 text-left text-sm">
                <thead><tr className="border-b border-rule text-[9px] uppercase tracking-[0.14em] text-ink-muted"><th className="pb-3">Noticia</th><th className="pb-3">Autor / categoría</th><th className="pb-3">Fecha</th><th className="pb-3">Estado</th></tr></thead>
                <tbody className="divide-y divide-rule">{data.recentArticles.map((article) => <tr key={article.id}>
                  <td className="py-3"><Link to={paths.adminNoticiaEditar(article.id)} className="flex items-center gap-3 font-semibold text-ink hover:text-brand">{article.featured_image ? <img src={article.featured_image} alt="" className="h-10 w-14 object-cover" /> : <span className="h-10 w-14 bg-paper" />}<span className="max-w-56 truncate">{article.title}</span></Link></td>
                  <td className="py-3 text-xs text-ink-muted">{article.author?.full_name ?? 'Sin autor'}<span className="block">{article.category?.name ?? 'Sin categoría'}</span></td>
                  <td className="py-3 text-xs text-ink-muted">{new Date(article.created_at).toLocaleDateString('es-SV')}</td>
                  <td className="py-3"><AdminStatusBadge status={article.status} /></td>
                </tr>)}</tbody>
              </table></div> : <EmptyState title="Sin noticias" description="Todavía no hay noticias registradas." icon={Newspaper} />}
            </section>

            <section className={cardClass}>
              <h2 className="font-serif text-xl font-semibold">Estadísticas editoriales</h2>
              <p className="mt-1 text-xs text-ink-muted">Datos registrados en Supabase</p>
              <h3 className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Publicadas por día · últimos 7 días</h3>
              {data.publishedByDay.some((day) => day.value > 0) ? <div className="mt-3"><AdminBarChart data={data.publishedByDay} height={110} /></div> : <p className="mt-3 border border-dashed border-rule-strong p-4 text-center text-xs text-ink-muted">Sin publicaciones en este periodo.</p>}
              <h3 className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Actividad de creación</h3>
              {data.articlesByDay.some((day) => day.value > 0) ? <div className="mt-3"><AdminBarChart data={data.articlesByDay} height={100} /></div> : <p className="mt-3 border border-dashed border-rule-strong p-4 text-center text-xs text-ink-muted">Aún no hay actividad para mostrar.</p>}
              <h3 className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Más vistas</h3>
              {data.mostViewed.length ? <div className="mt-3"><AdminBarChart data={data.mostViewed.map((item) => ({ ...item, label: item.label.length > 12 ? `${item.label.slice(0, 11)}…` : item.label }))} height={90} /></div> : <p className="mt-3 border border-dashed border-rule-strong p-4 text-center text-xs text-ink-muted">Aún no hay visitas por noticia.</p>}
              <div className="mt-6 grid gap-2"><Link className="border border-rule-strong px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] hover:border-ink" to={paths.adminEstadisticas}>Abrir estadísticas del portal</Link>{profile?.role === 'admin' && <Link className="border border-rule-strong px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] hover:border-ink" to={paths.adminPublicidad}>Administrar publicidad</Link>}<Link className="border border-rule-strong px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] hover:border-ink" to={paths.adminNoticias}>Consultar noticias</Link><Link className="border border-rule-strong px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] hover:border-ink" to={paths.adminMultimedia}>Abrir biblioteca multimedia</Link><Link className="border border-rule-strong px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] hover:border-ink" to={paths.adminCategorias}>Administrar categorías</Link></div>
            </section>
          </div>
        </> : null}
      </Container>
    </>
  )
}
