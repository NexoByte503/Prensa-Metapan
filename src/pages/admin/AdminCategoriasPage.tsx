import { useEffect, useState } from 'react'
import { Archive, Pencil, Plus, Trash2 } from 'lucide-react'

import { Container } from '@/components/common/Container'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { PageLoading } from '@/components/common/PageLoading'
import { AdminModal } from '@/components/admin/AdminModal'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useAdminToast } from '@/components/admin/AdminToast'
import { Seo } from '@/components/seo/Seo'
import { useAuth } from '@/hooks'
import { paths } from '@/routes/paths'
import { slugify } from '@/utils/slug'
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  type CategoryInput,
} from '@/services/content'
import type { CategoryRow } from '@/types'

interface CategoryDraft {
  readonly id?: string
  readonly name: string
  readonly slug: string
  readonly description: string
}

const emptyCategoryDraft: CategoryDraft = {
  name: '',
  slug: '',
  description: '',
}

export default function AdminCategoriasPage() {
  const { isAdmin } = useAuth()
  const { push } = useAdminToast()

  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null)
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(emptyCategoryDraft)
  const [isSaving, setIsSaving] = useState(false)

  const [categoryToDelete, setCategoryToDelete] = useState<CategoryRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetchCategories()
      .then((result) => {
        if (!cancelled) {
          setCategories(result)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('No se pudieron cargar las categorías.')
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  function openCreate(): void {
    setEditingCategory(null)
    setCategoryDraft(emptyCategoryDraft)
    setModalOpen(true)
  }

  function openEdit(category: CategoryRow): void {
    setEditingCategory(category)
    setCategoryDraft({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
    })
    setModalOpen(true)
  }

  async function handleSave(): Promise<void> {
    const input: CategoryInput = {
      name: categoryDraft.name.trim(),
      slug: categoryDraft.slug.trim(),
      description: categoryDraft.description.trim() ? categoryDraft.description.trim() : null,
    }

    setIsSaving(true)

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, input)
        push('success', 'La categoría se actualizó correctamente.')
      } else {
        await createCategory(input)
        push('success', 'La categoría se creó correctamente.')
      }

      setModalOpen(false)
      setEditingCategory(null)

      const result = await fetchCategories()
      setCategories(result)
      setIsSaving(false)
    } catch (submitError) {
      setIsSaving(false)
      push('error', submitError instanceof Error ? submitError.message : 'No se pudo guardar la categoría.')
    }
  }

  async function handleDelete(): Promise<void> {
    if (!categoryToDelete) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteCategory(categoryToDelete.id)
      push('success', 'La categoría se eliminó correctamente.')
      setCategoryToDelete(null)

      const result = await fetchCategories()
      setCategories(result)
    } catch (submitError) {
      setIsDeleting(false)
      push('error', submitError instanceof Error ? submitError.message : 'No se pudo eliminar la categoría.')
    } finally {
      setIsDeleting(false)
    }
  }

  const canManage = isAdmin

  return (
    <>
      <Seo title="Categorías" path={paths.adminCategorias} noIndex />

      <PageHeader
        kicker="Contenido"
        title="Categorías"
        description="Secciones editoriales usadas para agrupar las noticias del portal."
        breadcrumbs={[
          { label: 'Panel', to: paths.admin },
          { label: 'Categorías' },
        ]}
        children={
          canManage ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-brand px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-brand-dark"
            >
              <Plus aria-hidden="true" size={15} strokeWidth={1.8} />
              Nueva categoría
            </button>
          ) : undefined
        }
      />

      <Container className="py-8 lg:py-12">
        {isLoading ? (
          <div className="border border-rule bg-paper-strong p-6">
            <PageLoading />
          </div>
        ) : error ? (
          <div role="alert" className="border border-brand/30 bg-brand-soft/70 p-4 text-xs text-ink">
            {error}
          </div>
        ) : categories.length === 0 ? (
          <EmptyState
            title="Sin categorías"
            description="Crea la primera sección editorial para comenzar a publicar noticias."
            icon={Archive}
          />
        ) : (
          <div className="overflow-hidden border border-rule bg-paper-strong shadow-editorial">
            <div className="overflow-x-auto">
              <table className="w-full min-w-140 text-left text-sm">
                <thead className="bg-night text-paper">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-paper/60">
                      Nombre
                    </th>
                    <th scope="col" className="px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-paper/60">
                      Slug
                    </th>
                    <th scope="col" className="px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-paper/60">
                      Descripción
                    </th>
                    <th scope="col" className="px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-paper/60">
                      Actualizada
                    </th>
                    {canManage ? (
                      <th scope="col" className="px-4 py-3 text-right text-[9px] font-semibold uppercase tracking-[0.16em] text-paper/60">
                        Acciones
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule bg-paper-strong">
                  {categories.map((category) => (
                    <tr key={category.id} className="align-middle">
                      <td className="px-4 py-4 font-serif text-base font-semibold text-ink">
                        {category.name}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-ink-muted">{category.slug}</td>
                      <td className="px-4 py-4 text-xs text-ink-muted">{category.description ?? '—'}</td>
                      <td className="px-4 py-4 text-xs text-ink-muted">
                        {category.updated_at ? new Date(category.updated_at).toLocaleDateString('es-SV') : '-'}
                      </td>
                      {canManage ? (
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(category)}
                              aria-label={`Editar ${category.name}`}
                              className="inline-flex h-9 w-9 items-center justify-center border border-rule-strong bg-paper-strong text-ink transition-colors hover:border-ink hover:bg-paper"
                            >
                              <Pencil aria-hidden="true" size={14} strokeWidth={1.8} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCategoryToDelete(category)}
                              aria-label={`Eliminar ${category.name}`}
                              className="inline-flex h-9 w-9 items-center justify-center border border-brand/30 bg-brand-soft/40 text-brand-dark transition-colors hover:bg-brand-soft"
                            >
                              <Trash2 aria-hidden="true" size={14} strokeWidth={1.8} />
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Container>

      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Editar categoría' : 'Nueva categoría'}
        description="El slug se genera automáticamente a partir del nombre y debe ser único."
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="category-name"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
            >
              Nombre
            </label>
            <input
              id="category-name"
              type="text"
              className="mt-2 h-12 w-full border border-rule-strong bg-paper-strong px-3.5 text-sm text-ink focus:border-brand focus:outline-none"
              value={categoryDraft.name}
              onChange={(event) =>
                setCategoryDraft({
                  ...categoryDraft,
                  name: event.target.value,
                  slug: slugify(event.target.value),
                })
              }
            />
          </div>
          <div>
            <label
              htmlFor="category-slug"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
            >
              Slug
            </label>
            <input
              id="category-slug"
              type="text"
              className="mt-2 h-12 w-full border border-rule-strong bg-paper-strong px-3.5 font-mono text-sm text-ink focus:border-brand focus:outline-none"
              value={categoryDraft.slug}
              onChange={(event) => setCategoryDraft({ ...categoryDraft, slug: event.target.value })}
            />
          </div>
          <div>
            <label
              htmlFor="category-description"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
            >
              Descripción
            </label>
            <textarea
              id="category-description"
              rows={3}
              className="mt-2 w-full border border-rule-strong bg-paper-strong px-3.5 py-3 text-sm text-ink focus:border-brand focus:outline-none"
              value={categoryDraft.description}
              onChange={(event) => setCategoryDraft({ ...categoryDraft, description: event.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="border border-rule-strong bg-paper-strong px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-paper"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="bg-brand px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              Guardar
            </button>
          </div>
        </div>
      </AdminModal>

      <ConfirmDialog
        isOpen={categoryToDelete !== null}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Eliminar categoría"
        message={
          <>
            La categoría <strong>{categoryToDelete?.name}</strong> será eliminada. Si tiene noticias
            asociadas, la operación será rechazada por la base de datos.
          </>
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        isSubmitting={isDeleting}
      />
    </>
  )
}
