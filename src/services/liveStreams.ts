import { getSupabaseClient } from '@/services/supabase'
import type { LiveStreamRow, LiveStreamStatus } from '@/types'

export type LiveStreamInput = Pick<LiveStreamRow, 'title' | 'description' | 'facebook_url' | 'status' | 'scheduled_at'>
const fields = 'id,title,description,facebook_url,embed_url,status,scheduled_at,started_at,finished_at,created_by,created_at,updated_at'
export function facebookEmbedUrl(value: string | null): string | null {
  if (!value) return null
  try { const url = new URL(value); if (!['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.watch', 'www.fb.watch'].includes(url.hostname)) return null; return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url.toString())}&show_text=false&width=1280` } catch { return null }
}
export async function fetchPublicLiveStreams(): Promise<LiveStreamRow[]> {
  const { data, error } = await getSupabaseClient().from('live_streams').select(fields).order('scheduled_at', { ascending: false, nullsFirst: false }).limit(12)
  if (error) throw new Error('No se pudieron cargar las transmisiones.')
  return (data ?? []) as LiveStreamRow[]
}
export async function fetchAdminLiveStreams(): Promise<LiveStreamRow[]> {
  const { data, error } = await getSupabaseClient().from('live_streams').select(fields).order('created_at', { ascending: false }).limit(200)
  if (error) throw new Error('No se pudieron cargar las transmisiones.')
  return (data ?? []) as LiveStreamRow[]
}
export async function saveLiveStream(input: LiveStreamInput, id?: string, createdBy?: string): Promise<void> {
  const facebookUrl = input.facebook_url?.trim() || null
  const embed = facebookEmbedUrl(facebookUrl)
  if (facebookUrl && !embed) throw new Error('Ingresa un enlace válido de Facebook o fb.watch.')
  const payload = { title: input.title.trim(), description: input.description?.trim() || null, facebook_url: facebookUrl, embed_url: embed, status: input.status as LiveStreamStatus, scheduled_at: input.scheduled_at ? new Date(input.scheduled_at).toISOString() : null, started_at: input.status === 'live' ? new Date().toISOString() : null, finished_at: input.status === 'finished' ? new Date().toISOString() : null, ...(createdBy ? { created_by: createdBy } : {}) }
  const result = id ? await getSupabaseClient().from('live_streams').update(payload).eq('id', id) : await getSupabaseClient().from('live_streams').insert(payload)
  if (result.error) throw new Error('No se pudo guardar la transmisión.')
}
export async function deleteLiveStream(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from('live_streams').delete().eq('id', id)
  if (error) throw new Error('No se pudo eliminar la transmisión.')
}
