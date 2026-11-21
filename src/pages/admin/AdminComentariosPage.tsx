import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, MessageSquare, ShieldX, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '@/components/common/Container'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { PageLoading } from '@/components/common/PageLoading'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useAdminToast } from '@/components/admin/AdminToast'
import { Seo } from '@/components/seo/Seo'
import { useAuth } from '@/hooks'
import { paths } from '@/routes/paths'
import { deleteComment, fetchModerationComments, moderateComment, type ModerationComment } from '@/services/content/comments'
import type { CommentStatus } from '@/types'

const statuses: Array<CommentStatus | 'all'> = ['pending', 'approved', 'rejected', 'spam', 'all']
const statusLabel: Record<CommentStatus | 'all', string> = { pending: 'Pendientes', approved: 'Aprobados', rejected: 'Rechazados', spam: 'Spam', all: 'Todos' }

export default function AdminComentariosPage() {
  const { isAdmin, profile } = useAuth()
  const { push } = useAdminToast()
  const [comments, setComments] = useState<ModerationComment[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<ModerationComment | null>(null)
  const [status, setStatus] = useState<CommentStatus | 'all'>('pending')
  const [search, setSearch] = useState('')
  const loadComments = useCallback(async () => {
    setLoading(true)
    try { setComments(await fetchModerationComments({ status, limit: 200 })) }
    catch (error) { push('error', error instanceof Error ? error.message : 'No se pudieron cargar los comentarios.') }
    finally { setLoading(false) }
  }, [push, status])
  useEffect(() => { void loadComments() }, [loadComments])
  const filtered = useMemo(() => { const q = search.trim().toLocaleLowerCase(); return comments.filter((c) => !q || `${c.authorName} ${c.articleTitle} ${c.content}`.toLocaleLowerCase().includes(q)) }, [comments, search])
  async function moderate(comment: ModerationComment, next: 'approved' | 'rejected' | 'spam') {
    if (!profile?.id) return
    setBusyId(comment.id)
    try { await moderateComment(comment.id, next, profile.id); setComments((items) => items.filter((item) => item.id !== comment.id)); push('success', `Comentario ${statusLabel[next].toLocaleLowerCase()}.`) }
    catch (error) { push('error', error instanceof Error ? error.message : 'No se pudo moderar el comentario.') }
    finally { setBusyId(null) }
  }
  async function remove() {
    if (!removeTarget) return
    setBusyId(removeTarget.id)
    try { await deleteComment(removeTarget.id); setComments((items) => items.filter((item) => item.id !== removeTarget.id)); setRemoveTarget(null); push('success', 'Comentario eliminado.') }
    catch (error) { push('error', error instanceof Error ? error.message : 'No se pudo eliminar el comentario.') }
    finally { setBusyId(null) }
  }
  return <>
    <Seo title="Comentarios" path={paths.adminComentarios} noIndex />
    <PageHeader kicker="Moderación" title="Comentarios" description="Busca, filtra y gestiona comentarios de lectores." breadcrumbs={[{ label: 'Panel', to: paths.admin }, { label: 'Comentarios' }]} />
    <Container className="py-8 lg:py-12">
      {!isAdmin ? <div role="alert" className="border border-brand/30 bg-brand-soft/70 p-4 text-sm">Solo un administrador puede moderar comentarios.</div> : <>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row"><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nombre, noticia o comentario" aria-label="Buscar comentarios" className="min-h-11 flex-1 border border-rule-strong bg-paper px-3 text-sm" /><select aria-label="Filtrar por estado" value={status} onChange={(e) => setStatus(e.target.value as CommentStatus | 'all')} className="min-h-11 border border-rule-strong bg-paper px-3 text-sm">{statuses.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}</select></div>
        {loading ? <div className="border border-rule bg-paper-strong p-6"><PageLoading /></div> : filtered.length === 0 ? <EmptyState title="Sin resultados" description="No hay comentarios para este filtro." icon={MessageSquare} /> : <ul className="space-y-4">{filtered.map((comment) => <li key={comment.id} className="border border-rule bg-paper-strong p-5 shadow-editorial"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-semibold text-ink">{comment.authorName}<span className="ml-2 text-xs font-normal text-ink-muted">· {comment.status}</span></p><Link to={paths.news} className="mt-1 inline-block text-xs text-brand">En noticia: {comment.articleTitle}</Link><p className="mt-1 text-[10px] text-ink-muted">{new Date(comment.createdAt).toLocaleString('es-SV')}</p></div><div className="flex flex-wrap gap-2">{comment.status !== 'approved' && <button disabled={busyId !== null} onClick={() => void moderate(comment, 'approved')} className="inline-flex items-center gap-1.5 bg-brand px-3 py-2 text-[10px] font-semibold uppercase text-white disabled:opacity-50"><Check size={13} /> Aprobar</button>}{comment.status !== 'rejected' && <button disabled={busyId !== null} onClick={() => void moderate(comment, 'rejected')} className="border border-rule-strong px-3 py-2 text-[10px] font-semibold uppercase disabled:opacity-50">Rechazar</button>}{comment.status !== 'spam' && <button disabled={busyId !== null} onClick={() => void moderate(comment, 'spam')} className="inline-flex items-center gap-1.5 border border-rule-strong px-3 py-2 text-[10px] font-semibold uppercase disabled:opacity-50"><ShieldX size={13} /> Spam</button>}<button disabled={busyId !== null} onClick={() => setRemoveTarget(comment)} className="inline-flex items-center gap-1.5 border border-brand/30 bg-brand-soft/40 px-3 py-2 text-[10px] font-semibold uppercase text-brand-dark disabled:opacity-50"><Trash2 size={13} /> Eliminar</button></div></div><p className="mt-4 whitespace-pre-wrap border-t border-rule pt-4 text-sm leading-relaxed text-ink">{comment.content}</p></li>)}</ul>}
      </>}
    </Container>
    <ConfirmDialog isOpen={removeTarget !== null} onClose={() => setRemoveTarget(null)} onConfirm={() => void remove()} title="Eliminar comentario" message={<>El comentario de <strong>{removeTarget?.authorName}</strong> se eliminará permanentemente.</>} confirmLabel="Eliminar" cancelLabel="Cancelar" isSubmitting={busyId !== null} />
  </>
}
