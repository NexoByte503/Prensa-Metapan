import { useCallback, useEffect, useState } from 'react'
import { BarChart3, Eye, Users, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdminBarChart } from '@/components/admin/AdminBarChart'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { Container } from '@/components/common/Container'
import { PageHeader } from '@/components/common/PageHeader'
import { PageLoading } from '@/components/common/PageLoading'
import { Seo } from '@/components/seo/Seo'
import { useAdminToast } from '@/components/admin/AdminToast'
import { useAuth } from '@/hooks'
import { paths } from '@/routes/paths'
import { fetchSiteAnalytics, type SiteAnalytics } from '@/services/analytics'

const card = 'border border-rule bg-paper-strong p-5 shadow-editorial'
export default function AdminEstadisticasPage() {
  const { isAdmin } = useAuth(); const { push } = useAdminToast()
  const [data, setData] = useState<SiteAnalytics | null>(null); const [days, setDays] = useState(30); const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { setLoading(true); try { setData(await fetchSiteAnalytics(days)) } catch (e) { push('error', e instanceof Error ? e.message : 'No se pudieron cargar las estadísticas.') } finally { setLoading(false) } }, [days, push])
  useEffect(() => { void load() }, [load])
  return <><Seo title="Estadísticas" path={paths.adminEstadisticas} noIndex /><PageHeader kicker="Analítica propia" title="Estadísticas del portal" description="Métricas agregadas desde visitas públicas registradas en Supabase." breadcrumbs={[{ label: 'Panel', to: paths.admin }, { label: 'Estadísticas' }]} /><Container className="space-y-6 py-8 lg:py-12">{!isAdmin ? <p role="alert">Solo un administrador puede consultar las estadísticas.</p> : <>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-ink-muted">Visitantes únicos son estimaciones basadas en identificadores aleatorios seudónimos.</p><label className="flex items-center gap-2 text-xs">Periodo<select value={days} onChange={(e) => setDays(Number(e.target.value))} className="border border-rule-strong bg-paper p-2"><option value={1}>Hoy</option><option value={7}>Últimos 7 días</option><option value={30}>Últimos 30 días</option><option value={90}>Últimos 90 días</option></select></label></div>
    {loading ? <div className={card}><PageLoading /></div> : data ? <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><AdminStatCard label="Visitas totales" value={data.total} icon={Eye} hint="Acumulado histórico" /><AdminStatCard label="Visitantes estimados" value={data.uniqueVisitors} icon={Users} hint={`Periodo seleccionado · ${days} días`} /><AdminStatCard label="Visitas hoy" value={data.today} icon={CalendarDays} /><AdminStatCard label="Últimos 7 / 30 días" value={`${data.last7} / ${data.last30}`} icon={BarChart3} /></section>
      <section className={card}><h2 className="font-serif text-xl font-semibold">Evolución de visitas</h2><p className="mt-1 text-xs text-ink-muted">Páginas vistas por día</p>{data.daily.some((x) => x.value > 0) ? <div className="mt-4"><AdminBarChart data={data.daily.map((x) => ({ label: new Date(`${x.date}T12:00:00`).toLocaleDateString('es-SV', { day: '2-digit', month: 'short' }), value: x.value }))} height={180} /></div> : <p className="mt-4 border border-dashed border-rule p-6 text-center text-sm text-ink-muted">Todavía no hay visitas registradas para este periodo.</p>}</section>
      <div className="grid gap-6 lg:grid-cols-2"><section className={card}><h2 className="font-serif text-xl font-semibold">Noticias más visitadas</h2>{data.topArticles.length ? <ol className="mt-4 divide-y divide-rule">{data.topArticles.map((item, index) => <li key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm"><span><span className="mr-2 text-xs text-ink-muted">{index + 1}.</span><Link className="hover:text-brand" to={paths.article(item.slug)} target="_blank" rel="noopener noreferrer">{item.title}</Link></span><strong>{item.views}</strong></li>)}</ol> : <p className="mt-4 text-sm text-ink-muted">Sin artículos medidos aún.</p>}</section><section className={card}><h2 className="font-serif text-xl font-semibold">Categorías consultadas</h2>{data.topCategories.length ? <div className="mt-4"><AdminBarChart data={data.topCategories.map((x) => ({ label: x.name, value: x.views }))} height={180} /></div> : <p className="mt-4 text-sm text-ink-muted">Sin datos disponibles aún.</p>}</section></div>
      <p className="text-xs leading-relaxed text-ink-muted">Las visitas se deduplican durante 30 minutos por ruta y visitante; las repeticiones de impresiones y clics publicitarios durante 30 segundos. Se excluyen sesiones editoriales y agentes automatizados conocidos. No se guarda IP ni el identificador en claro.</p>
    </> : null}
  </>}</Container></>
}
