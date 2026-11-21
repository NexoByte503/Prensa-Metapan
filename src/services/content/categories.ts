import { getSupabaseClient } from '@/services/supabase'
import type { CategoryRow } from '@/types'

import { contentQueryError } from './errors'

const categoryFields = 'id, name, slug, description, created_at, updated_at'

export async function fetchCategories(): Promise<CategoryRow[]> {
  const { data, error } = await getSupabaseClient()
    .from('categories')
    .select(categoryFields)
    .order('name', { ascending: true })

  if (error) {
    throw contentQueryError('No se pudieron cargar las categorías.')
  }

  return data ?? []
}

export async function fetchCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const { data, error } = await getSupabaseClient()
    .from('categories')
    .select(categoryFields)
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    throw contentQueryError('No se pudo cargar la categoría.')
  }

  return data
}

export interface CategoryInput {
  readonly name: string
  readonly slug: string
  readonly description?: string | null
}

export async function createCategory(input: CategoryInput): Promise<CategoryRow> {
  const { data, error } = await getSupabaseClient()
    .from('categories')
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
    })
    .select(categoryFields)
    .single()

  if (error) {
    throw contentQueryError('No se pudo crear la categoría.')
  }

  if (!data) {
    throw contentQueryError('No se pudo crear la categoría.')
  }

  return data
}

export async function updateCategory(
  categoryId: string,
  input: Partial<CategoryInput>,
): Promise<CategoryRow> {
  const { data, error } = await getSupabaseClient()
    .from('categories')
    .update({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
    })
    .eq('id', categoryId)
    .select(categoryFields)
    .single()

  if (error) {
    throw contentQueryError('No se pudo actualizar la categoría.')
  }

  if (!data) {
    throw contentQueryError('No se pudo actualizar la categoría.')
  }

  return data
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('categories').delete().eq('id', categoryId)

  if (error) {
    throw contentQueryError('No se pudo eliminar la categoría.')
  }
}
