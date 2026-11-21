import { getSupabaseClient } from '@/services/supabase'

export const EDITORIAL_STORAGE_BUCKETS = {
  articleImages: 'article-images',
  articleMedia: 'article-media',
  authorAvatars: 'author-avatars',
  advertisements: 'advertisements',
} as const

export type EditorialStorageBucket =
  | (typeof EDITORIAL_STORAGE_BUCKETS)[keyof typeof EDITORIAL_STORAGE_BUCKETS]

export type EditorialMediaType = 'image' | 'video' | 'audio' | 'document'

export interface EditorialMediaFile {
  readonly id: string | null
  readonly name: string
  readonly path: string
  readonly url: string
  readonly type: EditorialMediaType
  readonly mimeType: string
  readonly sizeBytes: number
  readonly uploadedAt: string | null
}

const IMAGE_TYPES: readonly EditorialMediaType[] = ['image']
const VIDEO_TYPES: readonly EditorialMediaType[] = ['video']

function extensionOf(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name)
  return match ? match[1]!.toLowerCase() : ''
}

function detectMediaType(name: string, mimeType: string): EditorialMediaType {
  const normalizedMime = mimeType.toLowerCase()
  const extension = extensionOf(name).replace(/^\./, '')

  if (normalizedMime.startsWith('image/')) {
    return 'image'
  }

  if (normalizedMime.startsWith('video/')) {
    return 'video'
  }

  if (normalizedMime.startsWith('audio/')) {
    return 'audio'
  }

  if (normalizedMime.startsWith('application/')) {
    return 'document'
  }

  if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(extension)) {
    return 'image'
  }

  if (['mp4', 'webm', 'mov', 'm4v'].includes(extension)) {
    return 'video'
  }

  if (['mp3', 'ogg', 'wav', 'm4a'].includes(extension)) {
    return 'audio'
  }

  return 'document'
}

export function getEditorialFileUrl(bucket: string, path: string): string {
  const { data } = getSupabaseClient().storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function listEditorialFiles(
  bucket: EditorialStorageBucket,
  options: { search?: string; types?: readonly EditorialMediaType[]; limit?: number } = {},
): Promise<EditorialMediaFile[]> {
  const storage = getSupabaseClient().storage.from(bucket)
  const search = options.search?.trim().toLowerCase()
  const allowedTypes = options.types?.length ? options.types : [IMAGE_TYPES, VIDEO_TYPES].flat()
  const entries: Array<{ id: string | null; name: string; path: string; created_at: string | null; updated_at: string | null; metadata: Record<string, unknown> | null }> = []
  const walk = async (folder: string, depth = 0): Promise<void> => {
    if (depth > 4) return
    const { data, error } = await storage.list(folder, { limit: 100, sortBy: { column: 'name', order: 'asc' } })
    if (error) throw new Error('No se pudo leer la biblioteca multimedia.')
    for (const file of data ?? []) {
      const path = folder ? `${folder}/${file.name}` : file.name
      if (file.id === null && file.metadata === null) await walk(path, depth + 1)
      else entries.push({ id: file.id, name: file.name, path, created_at: file.created_at, updated_at: file.updated_at, metadata: file.metadata as Record<string, unknown> | null })
    }
  }
  await walk('')

  const resolved = entries
    .filter((file) => !search || file.name.toLowerCase().includes(search) || file.path.toLowerCase().includes(search))
    .filter((file) => allowedTypes.includes(detectMediaType(file.name, String(file.metadata?.mimetype ?? ''))))
    .slice(0, options.limit ?? 50)
    .map((file) => {
      const metadataSize = Number(file.metadata?.size ?? 0)
      const mimeType = String(file.metadata?.mimetype ?? '') || (file.name.toLowerCase().match(/\.(mp4|webm)$/) ? 'video/mp4' : 'image/jpeg')
      return {
        id: file.id,
        name: file.name,
        path: `${bucket}/${file.path}`,
        url: getEditorialFileUrl(bucket, file.path),
        type: detectMediaType(file.name, mimeType),
        mimeType,
        sizeBytes: Number.isFinite(metadataSize) ? metadataSize : 0,
        uploadedAt: file.created_at ?? file.updated_at,
      }
    })

  return resolved
}

export function sanitizeStorageFileName(name: string): string {
  const extension = extensionOf(name)
  const baseName = name
    .replace(/\.[a-z0-9]+$/i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const safeBase = baseName.slice(0, 40) || 'archivo'
  const safeExtension = /^[a-z0-9]{1,8}$/.test(extension.replace(/^\./, ''))
    ? extension.replace(/^\./, '').toLowerCase()
    : ''

  return safeExtension ? `${safeBase}.${safeExtension}` : safeBase
}

export function validateEditorialFile(
  file: File,
  kind: 'image' | 'video',
  bucket: EditorialStorageBucket,
): { ok: true } | { ok: false; reason: string } {
  if (kind === 'video' && bucket !== EDITORIAL_STORAGE_BUCKETS.articleMedia) {
    return { ok: false, reason: 'Los videos solo se pueden guardar en el bucket multimedia.' }
  }
  const allowedMimeTypes: Record<'image' | 'video', readonly string[]> = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    video: ['video/mp4', 'video/webm'],
  }

  const allowedExtensions: Record<'image' | 'video', readonly string[]> = {
    image: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    video: ['mp4', 'webm'],
  }

  const isValidMime = allowedMimeTypes[kind].includes(file.type)
  const isValidExtension = allowedExtensions[kind].some(
    (extension) => extension === file.name.split('.').pop()?.toLowerCase(),
  )

  if (!isValidMime || !isValidExtension) {
    return {
      ok: false,
      reason: kind === 'image'
        ? 'Formato no permitido. Usa JPG, JPEG, PNG, WEBP o AVIF.'
        : 'Formato no permitido. Usa MP4 o WebM.',
    }
  }

  const bucketLimit =
    bucket === 'article-images'
      ? 10 * 1024 * 1024
      : bucket === 'author-avatars'
        ? 2 * 1024 * 1024
        : 50 * 1024 * 1024

  if (file.size > bucketLimit) {
    return { ok: false, reason: `El tamaño máximo permitido es ${Math.round(bucketLimit / (1024 * 1024))} MB.` }
  }

  return { ok: true }
}

export async function uploadEditorialFile(
  bucket: EditorialStorageBucket,
  file: File,
  kind: 'image' | 'video',
): Promise<{ path: string; url: string }> {
  const safeName = sanitizeStorageFileName(file.name)
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 16)
  const fileName = `${fingerprint}-${safeName}`
  const folder = kind === 'image' ? 'images' : 'videos'
  const path = `${folder}/${fileName}`
  const { data: existing, error: listError } = await getSupabaseClient().storage.from(bucket).list(folder, { search: fileName, limit: 100 })
  if (listError) throw new Error('No se pudo comprobar si el archivo ya existe.')
  if (existing?.some((item) => item.name === fileName)) return { path, url: getEditorialFileUrl(bucket, path) }

  const { error } = await getSupabaseClient().storage.from(bucket).upload(path, file, {
    upsert: false,
  })

  if (error) {
    throw new Error('No se pudo subir el archivo a Storage.')
  }

  const url = getEditorialFileUrl(bucket, path)

  return { path, url }
}

export async function deleteEditorialFile(
  bucket: EditorialStorageBucket,
  path: string,
): Promise<void> {
  const { error } = await getSupabaseClient().storage.from(bucket).remove([path])

  if (error) {
    throw new Error('No se pudo eliminar el archivo de Storage.')
  }
}
