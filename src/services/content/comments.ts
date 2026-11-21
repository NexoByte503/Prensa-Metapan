import { getSupabaseClient } from '@/services/supabase'

import { ContentServiceError } from './errors'
import type { CommentStatus } from '@/types'

export interface PublicComment {
  readonly id: string
  readonly authorName: string
  readonly content: string
  readonly createdAt: string
}

export interface ModerationComment extends PendingComment {
  readonly status: CommentStatus
}

export async function fetchPublishedComments(articleId: string): Promise<PublicComment[]> {
  const { data, error } = await getSupabaseClient().from('comments')
    .select('id, author_name, content, created_at')
    .eq('article_id', articleId).eq('status', 'approved')
    .order('created_at', { ascending: true }).limit(100)
    .overrideTypes<Array<{ id: string; author_name: string; content: string; created_at: string }>, { merge: false }>()
  if (error) throw new ContentServiceError('No se pudieron cargar los comentarios aprobados.')
  return (data ?? []).map((comment) => ({ id: comment.id, authorName: comment.author_name, content: comment.content, createdAt: comment.created_at }))
}

export async function submitPublicComment(articleId: string, name: string, content: string): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc('submit_public_comment', {
    target_article_id: articleId,
    submitted_name: name.trim(),
    submitted_content: content.trim(),
  })
  if (error) {
    const message = error.message.includes('2000') || error.message.includes('100 caracteres')
      ? error.message
      : 'No se pudo enviar el comentario. Intenta nuevamente.'
    throw new ContentServiceError(message)
  }
  return data
}

export async function fetchModerationComments(options: { status?: CommentStatus | 'all'; limit?: number } = {}): Promise<ModerationComment[]> {
  let query = getSupabaseClient().from('comments').select(`id, article_id, author_name, content, status, created_at, articles(title, slug)`)
    .order('created_at', { ascending: false }).limit(Math.min(Math.max(options.limit ?? 100, 1), 200))
  if (options.status && options.status !== 'all') query = query.eq('status', options.status)
  const { data, error } = await query.overrideTypes<Array<{
    id: string; article_id: string; author_name: string; content: string; status: CommentStatus; created_at: string
    articles: { title: string; slug: string } | Array<{ title: string; slug: string }> | null
  }>, { merge: false }>()
  if (error) throw new ContentServiceError('No se pudieron cargar los comentarios para moderación.')
  return (data ?? []).map((comment) => {
    const article = Array.isArray(comment.articles) ? comment.articles[0] : comment.articles
    return { id: comment.id, articleId: comment.article_id, articleTitle: article?.title ?? 'Noticia no disponible', authorName: comment.author_name, content: comment.content, createdAt: comment.created_at, status: comment.status }
  })
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('comments').delete().eq('id', commentId)
  if (error) throw new ContentServiceError('No se pudo eliminar el comentario.')
}

export interface PendingComment {
  readonly id: string
  readonly articleId: string
  readonly articleTitle: string
  readonly authorName: string
  readonly content: string
  readonly createdAt: string
}

export async function fetchPendingComments(limit = 20): Promise<PendingComment[]> {
  const { data, error } = await getSupabaseClient()
    .from('comments')
    .select(
      `
      id,
      article_id,
      author_name,
      content,
      created_at,
      articles (
        id,
        title,
        slug
      )
      `,
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50))

  if (error) {
    throw new ContentServiceError('No se pudieron cargar los comentarios pendientes.')
  }

  return (data ?? []).map((comment) => {
    const article = Array.isArray(comment.articles)
      ? comment.articles[0]
      : comment.articles

    const articleTitle = article ? article.title : 'Nota no disponible'

    return {
      id: comment.id,
      articleId: comment.article_id,
      articleTitle,
      authorName: comment.author_name,
      content: comment.content,
      createdAt: comment.created_at,
    }
  })
}

export async function moderateComment(
  commentId: string,
  status: 'approved' | 'rejected' | 'spam',
  moderatorId: string,
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('comments')
    .update({
      status,
      moderated_by: moderatorId,
      moderated_at: new Date().toISOString(),
    })
    .eq('id', commentId)

  if (error) {
    throw new ContentServiceError('No se pudo moderar el comentario.')
  }
}
