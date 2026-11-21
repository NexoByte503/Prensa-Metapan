import {
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Radio,
  BarChart3,
  Megaphone,
  Newspaper,
  Tags,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { Logo } from '@/components/common/Logo'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks'
import { paths } from '@/routes/paths'

export type AdminNavRole = 'admin' | 'editor'

interface AdminNavItem {
  readonly label: string
  readonly to: string
  readonly icon: LucideIcon
  readonly end?: boolean
  readonly roles: readonly AdminNavRole[]
}

interface AdminSidebarProps {
  readonly open: boolean
  readonly onClose: () => void
}

const contentNav: readonly AdminNavItem[] = [
  {
    label: 'Noticias',
    to: paths.adminNoticias,
    icon: Newspaper,
    roles: ['admin', 'editor'],
  },
  {
    label: 'Multimedia',
    to: paths.adminMultimedia,
    icon: ImageIcon,
    roles: ['admin', 'editor'],
  },
  {
    label: 'Categorías',
    to: paths.adminCategorias,
    icon: Tags,
    roles: ['admin', 'editor'],
  },
]

const dashboardNav: readonly AdminNavItem[] = [
  {
    label: 'Panel',
    to: paths.admin,
    icon: LayoutDashboard,
    end: true,
    roles: ['admin', 'editor'],
  },
  { label: 'Estadísticas', to: paths.adminEstadisticas, icon: BarChart3, roles: ['admin'] },
  { label: 'Publicidad', to: paths.adminPublicidad, icon: Megaphone, roles: ['admin'] },
]

const teamNav: readonly AdminNavItem[] = [
  {
    label: 'Usuarios',
    to: paths.adminUsuarios,
    icon: Users,
    roles: ['admin'],
  },
]

const moderationNav: readonly AdminNavItem[] = [
  { label: 'Comentarios', to: paths.adminComentarios, icon: MessageSquare, roles: ['admin'] },
  { label: 'Transmisiones', to: paths.adminTransmisiones, icon: Radio, roles: ['admin'] },
]

const isNavItemVisible = (item: AdminNavItem, role: AdminNavRole | null): boolean =>
  role !== null && item.roles.includes(role)

function NavSection({
  title,
  items,
  role,
  onClose,
}: {
  readonly title: string
  readonly items: readonly AdminNavItem[]
  readonly role: AdminNavRole | null
  readonly onClose: () => void
}) {
  const visibleItems = items.filter((item) => isNavItemVisible(item, role))

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <nav aria-label={title} className="space-y-6">
      <p className="px-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/40">
        {title}
      </p>

      <ul className="space-y-1">
        {visibleItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 border-l-2 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors',
                  isActive
                    ? 'border-brand-light text-paper'
                    : 'border-transparent text-white/60 hover:border-white/30 hover:text-paper',
                )
              }
            >
              <item.icon aria-hidden="true" size={16} strokeWidth={1.7} />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const { profile, isAdmin, isEditor } = useAuth()

  const userLabel = profile?.full_name ?? 'Equipo editorial'
  const roleLabel = isAdmin ? 'Administrador' : isEditor ? 'Editor' : 'Sesión editorial'
  const currentRole: AdminNavRole | null =
    profile?.role === 'admin' || profile?.role === 'editor' ? profile.role : null

  const content = (
    <div className="flex h-full flex-col gap-8">
      <div className="flex items-center justify-between gap-4 px-3">
        <Logo inverted compact />
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className="inline-flex h-9 w-9 items-center justify-center border border-night-rule text-paper/70 transition-colors hover:border-white/50 hover:text-paper md:hidden"
        >
          <X aria-hidden="true" size={16} strokeWidth={1.8} />
        </button>
      </div>

      <NavSection title="Panel" items={dashboardNav} role={currentRole} onClose={onClose} />
      <NavSection title="Contenido" items={contentNav} role={currentRole} onClose={onClose} />
      <NavSection title="Equipo" items={teamNav} role={currentRole} onClose={onClose} />
      <NavSection title="Moderación" items={moderationNav} role={currentRole} onClose={onClose} />

      <div className="mt-auto border-t border-night-rule pt-5">
        <p className="px-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/40">
          Sesión activa
        </p>
        <p className="mt-2 truncate px-3 font-serif text-lg font-semibold text-paper">
          {userLabel}
        </p>
        <p className="mt-1 px-3 text-[10px] uppercase tracking-[0.14em] text-white/50">
          {roleLabel}
        </p>
      </div>
    </div>
  )

  const desktopClasses =
    'hidden md:flex md:w-72 md:shrink-0 md:flex-col md:sticky md:top-0 md:h-dvh md:border-r md:border-night-rule md:bg-night'

  const mobileClasses =
    'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-night text-paper shadow-editorial md:hidden'

  if (open) {
    return (
      <div className="md:hidden">
        <div className="fixed inset-0 z-40 bg-night/70" onClick={onClose} aria-hidden="true" />
        <aside className={mobileClasses} aria-label="Navegación administrativa">
          {content}
        </aside>
      </div>
    )
  }

  return <aside className={desktopClasses}>{content}</aside>
}
