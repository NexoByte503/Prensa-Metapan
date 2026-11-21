import { useCallback, useEffect, useState } from 'react'
import { MailPlus, Shield, UserRound } from 'lucide-react'

import { Container } from '@/components/common/Container'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { PageLoading } from '@/components/common/PageLoading'
import { useAdminToast } from '@/components/admin/AdminToast'
import { AdminModal } from '@/components/admin/AdminModal'
import { Seo } from '@/components/seo/Seo'
import { useAuth } from '@/hooks'
import { paths } from '@/routes/paths'
import { fetchEditorialUsers, inviteEditorialEditor, setEditorialUserRole, type EditorialUser, type EditorialUserRole } from '@/services/users'

export default function AdminUsuariosPage() {
  const { isAdmin, profile } = useAuth()
  const { push } = useAdminToast()
  const [users, setUsers] = useState<EditorialUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setUsers(await fetchEditorialUsers())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el equipo editorial.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  async function handleRoleChange(user: EditorialUser, role: EditorialUserRole): Promise<void> {
    if (user.role === role || user.id === profile?.id) return
    setIsSaving(user.id)
    try {
      await setEditorialUserRole(user.id, role)
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, role } : item))
      push('success', 'El rol del usuario se actualizó correctamente.')
    } catch (saveError) {
      push('error', saveError instanceof Error ? saveError.message : 'No se pudo actualizar el rol.')
    } finally {
      setIsSaving(null)
    }
  }

  async function handleInvite(): Promise<void> {
    if (!inviteName.trim() || !inviteEmail.trim()) return
    setIsInviting(true)
    try {
      await inviteEditorialEditor(inviteEmail, inviteName)
      push('success', 'Invitación enviada. El usuario se creará con rol de editor al aceptar.')
      setInviteOpen(false)
      setInviteName('')
      setInviteEmail('')
      await loadUsers()
    } catch (inviteError) {
      push('error', inviteError instanceof Error ? inviteError.message : 'No se pudo enviar la invitación.')
    } finally { setIsInviting(false) }
  }

  return (
    <>
      <Seo title="Usuarios" path={paths.adminUsuarios} noIndex />
      <PageHeader
        kicker="Equipo editorial"
        title="Usuarios"
        description="Administra los permisos del equipo que publica en el portal."
        breadcrumbs={[{ label: 'Panel', to: paths.admin }, { label: 'Usuarios' }]}
        children={isAdmin ? <button type="button" onClick={() => setInviteOpen(true)} className="inline-flex items-center gap-2 bg-brand px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"><MailPlus size={15} /> Invitar editor</button> : undefined}
      />
      <Container className="py-8 lg:py-12">
        {!isAdmin ? (
          <div role="alert" className="border border-brand/30 bg-brand-soft/70 p-4 text-sm text-ink">
            No tienes permisos para administrar usuarios.
          </div>
        ) : isLoading ? (
          <div className="border border-rule bg-paper-strong p-6"><PageLoading /></div>
        ) : error ? (
          <div role="alert" className="border border-brand/30 bg-brand-soft/70 p-4 text-sm text-ink">{error}</div>
        ) : users.length === 0 ? (
          <EmptyState title="Sin usuarios" description="No hay perfiles editoriales para mostrar." icon={UserRound} />
        ) : (
          <div className="overflow-hidden border border-rule bg-paper-strong shadow-editorial">
            <div className="overflow-x-auto">
              <table className="w-full min-w-140 text-left text-sm">
                <thead className="bg-night text-paper"><tr>
                  <th scope="col" className="px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-paper/60">Usuario</th>
                  <th scope="col" className="px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-paper/60">Correo</th>
                  <th scope="col" className="px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-paper/60">Rol</th>
                </tr></thead>
                <tbody className="divide-y divide-rule">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-4 font-medium text-ink">{user.fullName}</td>
                      <td className="px-4 py-4 text-xs text-ink-muted">{user.email}</td>
                      <td className="px-4 py-4">
                        <label className="inline-flex items-center gap-2 text-xs text-ink">
                          <Shield aria-hidden="true" size={14} />
                          <span className="sr-only">Rol de {user.fullName}</span>
                          <select
                            value={user.role}
                            disabled={isSaving !== null || user.id === profile?.id}
                            onChange={(event) => void handleRoleChange(user, event.target.value as EditorialUserRole)}
                            className="border border-rule-strong bg-paper-strong px-3 py-2 disabled:opacity-60"
                          >
                            <option value="editor">Editor</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Container>
      <AdminModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Invitar editor" description="Se enviará un enlace de invitación. La cuenta recibirá el rol de editor por defecto.">
        <div className="space-y-4">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted" htmlFor="invite-name">Nombre<input id="invite-name" value={inviteName} onChange={(event) => setInviteName(event.target.value)} className="mt-2 h-11 w-full border border-rule-strong bg-paper-strong px-3 text-sm normal-case tracking-normal text-ink" maxLength={120} /></label>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted" htmlFor="invite-email">Correo<input id="invite-email" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} className="mt-2 h-11 w-full border border-rule-strong bg-paper-strong px-3 text-sm normal-case tracking-normal text-ink" /></label>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setInviteOpen(false)} className="border border-rule-strong px-4 py-2 text-[10px] font-semibold uppercase">Cancelar</button><button type="button" onClick={() => void handleInvite()} disabled={isInviting || !inviteName.trim() || !inviteEmail.trim()} className="bg-brand px-4 py-2 text-[10px] font-semibold uppercase text-white disabled:opacity-50">{isInviting ? 'Enviando…' : 'Enviar invitación'}</button></div>
        </div>
      </AdminModal>
    </>
  )
}
