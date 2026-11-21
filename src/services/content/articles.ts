import { getSupabaseClient } from '@/services/supabase'
import type { ArticleMediaRow, TagRow } from '@/types'
import type { ArticleStatus } from '@/types/article'

import { contentQueryError } from './errors'
import { slugify } from '@/utils/slug'

const summaryFields = `
  id,
  title,
  slug,
  subtitle,
  excerpt,
  featured_image,
  published_at,
  created_at,
  updated_at,
  seo_title,
  seo_description,
  og_image,
  featured_image_alt,
  is_featured,
  is_breaking,
  category:categories!articles_category_id_fkey(id, name, slug),
  author:profiles!articles_author_id_fkey(id, full_name, avatar_url)
`

const detailFields = `
  ${summaryFields},
  content
`

export interface ArticleCategory {
  readonly id: string
  readonly name: string
  readonly slug: string
}

export interface ArticleAuthor {
  readonly id: string
  readonly fullName: string
  readonly avatarUrl: string | null
}

export interface PublishedArticleSummary {
  readonly id: string
  readonly title: string
  readonly slug: string
  readonly subtitle: string | null
  readonly excerpt: string | null
  readonly featuredImage: string | null
  readonly publishedAt: string
  readonly updatedAt: string
  readonly seoTitle: string | null
  readonly seoDescription: string | null
  readonly ogImage: string | null
  readonly featuredImageAlt: string | null
  readonly isFeatured: boolean
  readonly isBreaking: boolean
  readonly category: ArticleCategory | null
  readonly author: ArticleAuthor | null
}

export interface PublishedArticleDetail extends PublishedArticleSummary {
  readonly content: string
}

interface ArticleSummaryQueryRow {
  id: string
  title: string
  slug: string
  subtitle: string | null
  excerpt: string | null
  featured_image: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  seo_title: string | null
  seo_description: string | null
  og_image: string | null
  featured_image_alt: string | null
  is_featured: boolean
  is_breaking: boolean
  category: ArticleCategory | null
  author: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

interface ArticleDetailQueryRow extends ArticleSummaryQueryRow {
  content: string
}

export interface FetchArticlesOptions {
  readonly limit?: number
  readonly offset?: number
  readonly featuredOnly?: boolean
  readonly breakingOnly?: boolean
}

function clampLimit(limit: number | undefined): number {
  if (!limit || Number.isNaN(limit)) {
    return 10
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 50)
}

function mapSummary(row: ArticleSummaryQueryRow): PublishedArticleSummary | null {
  if (!row.published_at) {
    return null
  }

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle,
    excerpt: row.excerpt,
    featuredImage: row.featured_image,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    ogImage: row.og_image,
    featuredImageAlt: row.featured_image_alt,
    isFeatured: row.is_featured,
    isBreaking: row.is_breaking,
    category: row.category,
    author: row.author
      ? {
          id: row.author.id,
          fullName: row.author.full_name,
          avatarUrl: row.author.avatar_url,
        }
      : null,
  }
}

export async function fetchPublishedArticles(
  options: FetchArticlesOptions = {},
): Promise<PublishedArticleSummary[]> {
  let query = getSupabaseClient()
    .from('articles')
    .select(summaryFields)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .range(
      Math.max(options.offset ?? 0, 0),
      Math.max(options.offset ?? 0, 0) + clampLimit(options.limit) - 1,
    )

  if (options.featuredOnly) {
    query = query.eq('is_featured', true)
  }

  if (options.breakingOnly) {
    query = query.eq('is_breaking', true)
  }

  const { data, error } = await query
    .overrideTypes<ArticleSummaryQueryRow[], { merge: false }>()

  if (error) {
    throw contentQueryError('No se pudieron cargar las noticias publicadas.')
  }

  return (data ?? [])
    .map(mapSummary)
    .filter((article): article is PublishedArticleSummary => article !== null)
}

export async function fetchPublishedArticlesByCategory(
  categorySlug: string,
  options: FetchArticlesOptions = {},
): Promise<PublishedArticleSummary[]> {
  const { data: category, error: categoryError } = await getSupabaseClient()
    .from('categories')
    .select('id, slug')
    .eq('slug', categorySlug)
    .maybeSingle()
    .overrideTypes<{ id: string; slug: string } | null, { merge: false }>()

  if (categoryError) {
    throw contentQueryError('No se pudo cargar la categoría.')
  }

  if (!category) {
    return []
  }

  const { data, error } = await getSupabaseClient()
    .from('articles')
    .select(summaryFields)
    .eq('category_id', category.id)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .range(
      Math.max(options.offset ?? 0, 0),
      Math.max(options.offset ?? 0, 0) + clampLimit(options.limit) - 1,
    )
    .overrideTypes<ArticleSummaryQueryRow[], { merge: false }>()

  if (error) {
    throw contentQueryError('No se pudieron cargar las noticias de la categoría.')
  }

  return (data ?? [])
    .map(mapSummary)
    .filter((article): article is PublishedArticleSummary => article !== null)
}

export async function fetchPublishedArticleBySlug(
  slug: string,
): Promise<PublishedArticleDetail | null> {
  const { data, error } = await getSupabaseClient()
    .from('articles')
    .select(detailFields)
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .maybeSingle()
    .overrideTypes<ArticleDetailQueryRow | null, { merge: false }>()

  if (error) {
    throw contentQueryError('No se pudo cargar la noticia.')
  }

  if (!data) {
    return null
  }

  const summary = mapSummary(data)

  if (!summary) {
    return null
  }

  return {
    ...summary,
    content: data.content,
  }
}

export async function searchPublishedArticles(
  searchTerm: string,
  limit = 12,
  offset = 0,
): Promise<PublishedArticleSummary[]> {
  const queryText = searchTerm.trim()

  if (queryText.length < 2) {
    return []
  }

  const pageSize = clampLimit(limit)
  const { data: articleIds, error: searchError } = await getSupabaseClient()
    .rpc('search_published_article_ids', {
      search_query: queryText,
      page_limit: pageSize + 1,
      page_offset: Math.max(0, offset),
    })

  if (searchError) {
    throw contentQueryError('No se pudo realizar la búsqueda.')
  }

  const ids = articleIds ?? []
  if (ids.length === 0) return []

  const { data, error } = await getSupabaseClient()
    .from('articles')
    .select(summaryFields)
    .in('id', ids)
    .overrideTypes<ArticleSummaryQueryRow[], { merge: false }>()

  if (error) {
    throw contentQueryError('No se pudo realizar la búsqueda.')
  }

  const byId = new Map((data ?? []).map((row) => [row.id, row]))
  return ids
    .map((id) => byId.get(id))
    .filter((row): row is ArticleSummaryQueryRow => row !== undefined)
    .map(mapSummary)
    .filter((article): article is PublishedArticleSummary => article !== null)
}

export async function fetchRelatedPublishedArticles(
  articleId: string,
  categoryId: string | null,
  limit = 4,
): Promise<PublishedArticleSummary[]> {
  const client = getSupabaseClient()
  const [currentTags, recent] = await Promise.all([
    client.from('article_tags').select('tag_id').eq('article_id', articleId)
      .overrideTypes<Array<{ tag_id: string }>, { merge: false }>(),
    categoryId ? fetchPublishedArticlesByCategoryById(categoryId, limit + 1) : fetchPublishedArticles({ limit: limit + 1 }),
  ])

  if (currentTags.error) throw contentQueryError('No se pudieron cargar las etiquetas para noticias relacionadas.')
  const tagIds = (currentTags.data ?? []).map((entry) => entry.tag_id)
  let relatedByTag: PublishedArticleSummary[] = []
  if (tagIds.length) {
    const { data: relations, error } = await client.from('article_tags').select('article_id').in('tag_id', tagIds).neq('article_id', articleId)
      .overrideTypes<Array<{ article_id: string }>, { merge: false }>()
    if (error) throw contentQueryError('No se pudieron cargar las noticias relacionadas.')
    const ids = [...new Set((relations ?? []).map((row) => row.article_id))]
    if (ids.length) {
      const { data, error: articlesError } = await client.from('articles').select(summaryFields).in('id', ids)
        .eq('status', 'published').lte('published_at', new Date().toISOString()).order('published_at', { ascending: false })
        .limit(limit).overrideTypes<ArticleSummaryQueryRow[], { merge: false }>()
      if (articlesError) throw contentQueryError('No se pudieron cargar las noticias relacionadas.')
      relatedByTag = (data ?? []).map(mapSummary).filter((item): item is PublishedArticleSummary => item !== null)
    }
  }

  const candidates = [...relatedByTag, ...recent.filter((item) => item.id !== articleId)]
  const unique = [...new Map(candidates.map((item) => [item.id, item])).values()]
  if (unique.length >= limit) return unique.slice(0, limit)
  const remaining = await fetchPublishedArticles({ limit: limit + 1 })
  return [...new Map([...unique, ...remaining.filter((item) => item.id !== articleId)].map((item) => [item.id, item])).values()].slice(0, limit)
}

async function fetchPublishedArticlesByCategoryById(categoryId: string, limit: number): Promise<PublishedArticleSummary[]> {
  const { data, error } = await getSupabaseClient().from('articles').select(summaryFields).eq('category_id', categoryId)
    .eq('status', 'published').lte('published_at', new Date().toISOString()).order('published_at', { ascending: false })
    .limit(limit).overrideTypes<ArticleSummaryQueryRow[], { merge: false }>()
  if (error) throw contentQueryError('No se pudieron cargar noticias de la misma categoría.')
  return (data ?? []).map(mapSummary).filter((article): article is PublishedArticleSummary => article !== null)
}

export async function fetchTagsForArticle(articleId: string): Promise<TagRow[]> {
  const { data: relations, error: relationError } = await getSupabaseClient()
    .from('article_tags')
    .select('article_id, tag_id')
    .eq('article_id', articleId)
    .overrideTypes<{ article_id: string; tag_id: string }[], { merge: false }>()

  if (relationError) {
    throw contentQueryError('No se pudieron cargar las etiquetas.')
  }

  const tagIds = (relations ?? []).map((relation) => relation.tag_id)

  if (tagIds.length === 0) {
    return []
  }

  const { data, error } = await getSupabaseClient()
    .from('tags')
    .select('id, name, slug, created_at')
    .in('id', tagIds)
    .order('name', { ascending: true })

  if (error) {
    throw contentQueryError('No se pudieron cargar las etiquetas.')
  }

  return data ?? []
}

export async function fetchMediaForArticle(
  articleId: string,
): Promise<ArticleMediaRow[]> {
  const { data, error } = await getSupabaseClient()
    .from('article_media')
    .select('id, article_id, media_url, media_type, alt_text, caption, created_at')
    .eq('article_id', articleId)
    .order('created_at', { ascending: true })

  if (error) {
    throw contentQueryError('No se pudo cargar el contenido multimedia.')
  }

  return data ?? []
}

// -----------------------------------------------------------------------------
// Servicios administrativos de noticias (Fase 3)
// -----------------------------------------------------------------------------

export type AdminArticleSortField =
  | 'created_at'
  | 'updated_at'
  | 'published_at'
  | 'title'

export interface AdminArticleListOptions {
  readonly search?: string
  readonly categoryId?: string | null
  readonly authorId?: string | null
  readonly status?: ArticleStatus | null
  readonly publishedFrom?: string | null
  readonly publishedTo?: string | null
  readonly limit?: number
  readonly offset?: number
  readonly sortField?: AdminArticleSortField
  readonly sortDirection?: 'asc' | 'desc'
}

export interface AdminArticleRow {
  readonly id: string
  readonly title: string
  readonly slug: string
  readonly subtitle: string | null
  readonly content: string
  readonly excerpt: string | null
  readonly featuredImage: string | null
  readonly status: ArticleStatus
  readonly isFeatured: boolean
  readonly isBreaking: boolean
  readonly viewsCount: number
  readonly publishedAt: string | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly seoTitle: string | null
  readonly seoDescription: string | null
  readonly ogImage: string | null
  readonly featuredImageAlt: string | null
  readonly category: ArticleCategory | null
  readonly author: ArticleAuthor | null
}

const adminArticleSummaryFields = `
  id,
  title,
  slug,
  subtitle,
  excerpt,
  featured_image,
  status,
  is_featured,
  is_breaking,
  views_count,
  published_at,
  created_at,
  updated_at,
  seo_title,
  seo_description,
  og_image,
  featured_image_alt,
  category:categories!articles_category_id_fkey(id, name, slug),
  author:profiles!articles_author_id_fkey(id, full_name, avatar_url)
`

const adminArticleDetailFields = `
  ${adminArticleSummaryFields},
  content
`

interface AdminArticleQueryRow {
  id: string
  title: string
  slug: string
  subtitle: string | null
  excerpt: string | null
  featured_image: string | null
  status: ArticleStatus
  is_featured: boolean
  is_breaking: boolean
  views_count: number
  published_at: string | null
  created_at: string
  updated_at: string
  category: ArticleCategory | null
  author: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
  content: string
  seo_title: string | null
  seo_description: string | null
  og_image: string | null
  featured_image_alt: string | null
}

function mapAdminArticle(row: AdminArticleQueryRow): AdminArticleRow {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle,
    content: row.content,
    excerpt: row.excerpt,
    featuredImage: row.featured_image,
    status: row.status,
    isFeatured: row.is_featured,
    isBreaking: row.is_breaking,
    viewsCount: Number(row.views_count ?? 0),
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    ogImage: row.og_image,
    featuredImageAlt: row.featured_image_alt,
    category: row.category,
    author: row.author
      ? {
          id: row.author.id,
          fullName: row.author.full_name,
          avatarUrl: row.author.avatar_url,
        }
      : null,
  }
}

export async function fetchAdminArticles(
  options: AdminArticleListOptions = {},
): Promise<AdminArticleRow[]> {
  let query = getSupabaseClient()
    .from('articles')
    .select(adminArticleSummaryFields)
    .order(
      options.sortField ?? 'updated_at',
      { ascending: (options.sortDirection ?? 'desc') === 'asc' },
    )
    .range(
      Math.max(options.offset ?? 0, 0),
      Math.max(options.offset ?? 0, 0) + Math.max(Math.min(options.limit ?? 10, 50), 1) - 1,
    )

  if (options.search?.trim()) {
    query = query.ilike('title', `%${options.search.trim()}%`)
  }

  if (options.categoryId) {
    query = query.eq('category_id', options.categoryId)
  }

  if (options.authorId) {
    query = query.eq('author_id', options.authorId)
  }

  if (options.status) {
    query = query.eq('status', options.status)
  }

  if (options.publishedFrom) {
    query = query.gte('published_at', options.publishedFrom)
  }

  if (options.publishedTo) {
    query = query.lte('published_at', options.publishedTo)
  }

  const { data, error } = await query.overrideTypes<AdminArticleQueryRow[], { merge: false }>()

  if (error) {
    throw contentQueryError('No se pudieron cargar las noticias.')
  }

  return (data ?? []).map(mapAdminArticle)
}

export async function fetchAdminArticleById(
  articleId: string,
): Promise<AdminArticleRow | null> {
  const { data, error } = await getSupabaseClient()
    .from('articles')
    .select(adminArticleDetailFields)
    .eq('id', articleId)
    .maybeSingle()
    .overrideTypes<AdminArticleQueryRow | null, { merge: false }>()

  if (error) {
    throw contentQueryError('No se pudo cargar la noticia.')
  }

  if (!data) {
    return null
  }

  return mapAdminArticle(data)
}

export interface SaveArticleInput {
  readonly title: string
  readonly slug?: string | null
  readonly subtitle?: string | null
  readonly content: string
  readonly excerpt?: string | null
  readonly featuredImage?: string | null
  readonly featuredImageAlt?: string | null
  readonly seoTitle?: string | null
  readonly seoDescription?: string | null
  readonly ogImage?: string | null
  readonly categoryId: string
  readonly authorId: string
  readonly status: ArticleStatus
  readonly isFeatured: boolean
  readonly isBreaking: boolean
  readonly publishedAt: string | null
  readonly tagIds?: readonly string[]
}

async function generateUniqueSlug(title: string, excludeArticleId?: string): Promise<string> {
  const baseSlug = slugify(title) || 'noticia'
  let candidate = baseSlug
  let suffix = 0

  for (;;) {
    const { data, error } = await getSupabaseClient()
      .from('articles')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()
      .overrideTypes<{ id: string } | null, { merge: false }>()

    if (error) {
      throw contentQueryError('No se pudo generar un slug único.')
    }

    const isCollision = data !== null && data.id !== excludeArticleId

    if (!isCollision) {
      return candidate
    }

    suffix += 1
    candidate = `${baseSlug}-${suffix}`
  }
}

export async function createArticle(input: SaveArticleInput): Promise<AdminArticleRow> {
  const slug = await generateUniqueSlug(input.slug || input.title)
  const publishedAt =
    input.status === 'published' ? input.publishedAt ?? new Date().toISOString() : null

  const { data, error } = await getSupabaseClient()
    .from('articles')
    .insert({
      title: input.title,
      slug,
      subtitle: input.subtitle,
      content: input.content,
      excerpt: input.excerpt,
      featured_image: input.featuredImage,
      featured_image_alt: input.featuredImageAlt,
      seo_title: input.seoTitle,
      seo_description: input.seoDescription,
      og_image: input.ogImage,
      category_id: input.categoryId,
      author_id: input.authorId,
      status: input.status,
      is_featured: input.isFeatured,
      is_breaking: input.isBreaking,
      published_at: publishedAt,
    })
    .select(adminArticleDetailFields)
    .single()
    .overrideTypes<AdminArticleQueryRow, { merge: false }>()

  if (error) {
    throw contentQueryError('No se pudo guardar la noticia.')
  }

  if (!data) {
    throw contentQueryError('No se pudo guardar la noticia.')
  }

  const article = mapAdminArticle(data)

  if (input.tagIds && input.tagIds.length > 0) {
    await saveArticleTags(article.id, input.tagIds)
  }

  return article
}

export async function updateArticle(
  articleId: string,
  input: SaveArticleInput,
): Promise<AdminArticleRow> {
  const { data: existingArticle } = await getSupabaseClient()
    .from('articles')
    .select('slug')
    .eq('id', articleId)
    .maybeSingle()
    .overrideTypes<{ slug: string } | null, { merge: false }>()

  const slug = input.slug && input.slug === existingArticle?.slug
    ? input.slug
    : await generateUniqueSlug(input.slug || input.title, articleId)

  const publishedAt =
    input.status === 'published' ? input.publishedAt ?? new Date().toISOString() : null

  const { data, error } = await getSupabaseClient()
    .from('articles')
    .update({
      title: input.title,
      slug,
      subtitle: input.subtitle,
      content: input.content,
      excerpt: input.excerpt,
      featured_image: input.featuredImage,
      featured_image_alt: input.featuredImageAlt,
      seo_title: input.seoTitle,
      seo_description: input.seoDescription,
      og_image: input.ogImage,
      category_id: input.categoryId,
      author_id: input.authorId,
      status: input.status,
      is_featured: input.isFeatured,
      is_breaking: input.isBreaking,
      published_at: publishedAt,
    })
    .eq('id', articleId)
    .select(adminArticleDetailFields)
    .single()
    .overrideTypes<AdminArticleQueryRow, { merge: false }>()

  if (error) {
    throw contentQueryError('No se pudo actualizar la noticia.')
  }

  if (!data) {
    throw contentQueryError('No se pudo actualizar la noticia.')
  }

  const article = mapAdminArticle(data)

  if (input.tagIds) {
    await saveArticleTags(article.id, input.tagIds)
  }

  return article
}

export async function deleteArticle(articleId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('articles').delete().eq('id', articleId)

  if (error) {
    throw contentQueryError('No se pudo eliminar la noticia.')
  }
}

export async function setArticleStatus(
  articleId: string,
  status: ArticleStatus,
): Promise<AdminArticleRow> {
  const publishedAt = status === 'published' ? new Date().toISOString() : null

  const { data, error } = await getSupabaseClient()
    .from('articles')
    .update({
      status,
      published_at: publishedAt,
    })
    .eq('id', articleId)
    .select(adminArticleDetailFields)
    .single()
    .overrideTypes<AdminArticleQueryRow, { merge: false }>()

  if (error) {
    throw contentQueryError('No se pudo actualizar el estado de la noticia.')
  }

  if (!data) {
    throw contentQueryError('No se pudo actualizar el estado de la noticia.')
  }

  return mapAdminArticle(data)
}

export async function fetchEditorialProfiles(): Promise<
  Array<{
    readonly id: string
    readonly fullName: string
    readonly avatarUrl: string | null
    readonly role: string
  }>
> {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select('id, full_name, avatar_url, role')
    .in('role', ['admin', 'editor'])
    .order('full_name', { ascending: true })

  if (error) {
    throw contentQueryError('No se pudieron cargar los autores editoriales.')
  }

  return (data ?? []).map((profile) => ({
    id: profile.id,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    role: profile.role,
  }))
}

export async function fetchAllTags(): Promise<TagRow[]> {
  const { data, error } = await getSupabaseClient()
    .from('tags')
    .select('id, name, slug, created_at')
    .order('name', { ascending: true })

  if (error) {
    throw contentQueryError('No se pudieron cargar las etiquetas.')
  }

  return data ?? []
}

export async function saveArticleTags(articleId: string, tagIds: readonly string[]): Promise<void> {
  const { data: existing, error: existingError } = await getSupabaseClient()
    .from('article_tags')
    .select('article_id, tag_id')
    .eq('article_id', articleId)
    .overrideTypes<{ article_id: string; tag_id: string }[], { merge: false }>()

  if (existingError) {
    throw contentQueryError('No se pudieron cargar las etiquetas de la noticia.')
  }

  const currentTagIds = new Set((existing ?? []).map((relation) => relation.tag_id))
  const desiredTagIds = new Set(tagIds)
  const toAdd = [...desiredTagIds].filter((tagId) => !currentTagIds.has(tagId))
  const toRemove = [...currentTagIds].filter((tagId) => !desiredTagIds.has(tagId))

  if (toRemove.length > 0) {
    const { error: removeError } = await getSupabaseClient()
      .from('article_tags')
      .delete()
      .eq('article_id', articleId)
      .in('tag_id', toRemove)

    if (removeError) {
      throw contentQueryError('No se pudieron actualizar las etiquetas de la noticia.')
    }
  }

  if (toAdd.length > 0) {
    const { error: addError } = await getSupabaseClient()
      .from('article_tags')
      .insert(
        toAdd.map((tagId) => ({ article_id: articleId, tag_id: tagId })),
      )

    if (addError) {
      throw contentQueryError('No se pudieron actualizar las etiquetas de la noticia.')
    }
  }
}
