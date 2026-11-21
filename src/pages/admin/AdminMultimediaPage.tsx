import { useCallback, useEffect, useRef, useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'

import { ActionLink } from '@/components/common/ActionLink'
import { Container } from '@/components/common/Container'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { PageLoading } from '@/components/common/PageLoading'
import { AdminToastProvider, useAdminToast } from '@/components/admin/AdminToast'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useAuth } from '@/hooks'
import { Seo } from '@/components/seo/Seo'
import { paths } from '@/routes/paths'
import {
  deleteEditorialFile,
  EDITORIAL_STORAGE_BUCKETS,
  listEditorialFiles,
  uploadEditorialFile,
  validateEditorialFile,
  type EditorialMediaFile,
  type EditorialMediaType,
} from '@/services/multimedia'
import type { EditorialStorageBucket } from '@/services/multimedia'

const IMAGE_BUCKETS: readonly EditorialStorageBucket[] = [
  EDITORIAL_STORAGE_BUCKETS.articleImages,
  EDITORIAL_STORAGE_BUCKETS.authorAvatars,
]

const VIDEO_BUCKETS: readonly EditorialStorageBucket[] = [
  EDITORIAL_STORAGE_BUCKETS.articleMedia,
]

const ACCEPTED_MEDIA_TYPES: readonly EditorialMediaType[] = ['image', 'video']

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '—'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function AdminMultimediaPage() {
  const { isAdmin } = useAuth()
  const { push } = useAdminToast()

  const [files, setFiles] = useState<EditorialMediaFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<EditorialMediaType | ''>('')

  const [uploadBucket, setUploadBucket] = useState<EditorialStorageBucket>(EDITORIAL_STORAGE_BUCKETS.articleImages)
  const [uploadKind, setUploadKind] = useState<'image' | 'video'>('image')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [fileToDelete, setFileToDelete] = useState<EditorialMediaFile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const loadFiles = useCallback(async (options?: { search?: string; types?: readonly EditorialMediaType[] }) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await listEditorialFiles(uploadBucket, {
        search: options?.search,
        types: options?.types ?? ACCEPTED_MEDIA_TYPES,
      })

      setFiles(result)
      setIsLoading(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo cargar la biblioteca.')
      setIsLoading(false)
    }
  }, [uploadBucket])

  useEffect(() => {
    void loadFiles({ search, types: typeFilter ? [typeFilter] : ACCEPTED_MEDIA_TYPES })
  }, [loadFiles, search, typeFilter])

  async function handleUpload(): Promise<void> {
    if (!uploadFile) {
      return
    }

    const validation = validateEditorialFile(uploadFile, uploadKind, uploadBucket)

    if (!validation.ok) {
      push('error', validation.reason)
      return
    }

    setIsUploading(true)

    try {
      const result = await uploadEditorialFile(uploadBucket, uploadFile, uploadKind)
      push('success', 'El archivo se subió correctamente a Storage.')

      setUploadFile(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      const resultList = await listEditorialFiles(uploadBucket, {
        search: result.path.split('/').pop(),
        types: [uploadKind],
      })

      setFiles(resultList)
    } catch (submitError) {
      push('error', submitError instanceof Error ? submitError.message : 'No se pudo subir el archivo.')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDelete(): Promise<void> {
    if (!fileToDelete) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteEditorialFile(fileToDelete.bucket, fileToDelete.path)
      push('success', 'El archivo se eliminó correctamente.')
      setFileToDelete(null)

      const result = await listEditorialFiles(uploadBucket, {
        types: ACCEPTED_MEDIA_TYPES,
      })

      setFiles(result)
    } catch (submitError) {
      push('error', submitError instanceof Error ? submitError.message : 'No se pudo eliminar el archivo.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Seo title="Multimedia" path={paths.adminMultimedia} noIndex />

      <PageHeader
        kicker="Contenido"
        title="Multimedia"
        description="Biblioteca y subida de imágenes y videos editoriales conectada a Supabase Storage."
        breadcrumbs={[
          { label: 'Panel', to: paths.admin },
          { label: 'Multimedia' },
        ]}
      />

      <Container className="py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <section className="space-y-5">
            <div className="border border-rule bg-paper-strong p-5 shadow-editorial">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Subida
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="media-bucket"
                    className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
                  >
                    Bucket
                  </label>
                  <select
                    id="media-bucket"
                    value={uploadBucket}
                    onChange={(event) => setUploadBucket(event.target.value as EditorialStorageBucket)}
                    className="mt-2 h-11 w-full border border-rule-strong bg-paper-strong px-3.5 text-sm text-ink focus:border-brand focus:outline-none"
                  >
                    {IMAGE_BUCKETS.map((bucket) => (
                      <option key={bucket} value={bucket}>
                        {bucket}
                      </option>
                    ))}
                    {VIDEO_BUCKETS.map((bucket) => (
                      <option key={bucket} value={bucket}>
                        {bucket}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="media-kind"
                    className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
                  >
                    Tipo
                  </label>
                  <select
                    id="media-kind"
                    value={uploadKind}
                    onChange={(event) => setUploadKind(event.target.value as 'image' | 'video')}
                    className="mt-2 h-11 w-full border border-rule-strong bg-paper-strong px-3.5 text-sm text-ink focus:border-brand focus:outline-none"
                  >
                    <option value="image">Imagen</option>
                    <option value="video">Video</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  id="media-file"
                  type="file"
                  accept={uploadKind === 'image' ? 'image/jpeg,image/png,image/webp,image/avif' : 'video/mp4,video/webm'}
                  onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-rule-strong bg-paper-strong px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-paper"
                >
                  Seleccionar archivo
                </button>
                <button
                  type="button"
                  onClick={() => void handleUpload()}
                  disabled={!uploadFile || isUploading}
                  className="bg-brand px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploading ? 'Subiendo…' : 'Subir'}
                </button>
                {uploadFile ? (
                  <p className="text-xs text-ink-muted">
                    {uploadFile.name} · {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                ) : null}
              </div>
            </div>

            <div className="border border-rule bg-paper-strong p-5 shadow-editorial">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="media-search"
                    className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
                  >
                    Buscar por nombre
                  </label>
                  <input
                    id="media-search"
                    type="search"
                    placeholder="Buscar archivo…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="mt-2 h-11 w-full border border-rule-strong bg-paper-strong px-3.5 text-sm text-ink placeholder:text-ink-muted/60 focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="media-type"
                    className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
                  >
                    Tipo
                  </label>
                  <select
                    id="media-type"
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value as EditorialMediaType | '')}
                    className="mt-2 h-11 w-full border border-rule-strong bg-paper-strong px-3.5 text-sm text-ink focus:border-brand focus:outline-none"
                  >
                    <option value="">Todos</option>
                    <option value="image">Imágenes</option>
                    <option value="video">Videos</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            {isLoading ? (
              <div className="border border-rule bg-paper-strong p-6">
                <PageLoading />
              </div>
            ) : error ? (
              <div role="alert" className="border border-brand/30 bg-brand-soft/70 p-4 text-xs text-ink">
                {error}
              </div>
            ) : files.length === 0 ? (
              <EmptyState
                title="Biblioteca vacía"
                description="Sube la primera imagen o video editorial para usarlo en noticias y notas multimedia."
                icon={ImageIcon}
              />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {files.map((file) => (
                  <li key={file.path} className="border border-rule bg-paper-strong shadow-editorial">
                    <div className="aspect-video bg-night">
                      {file.type === 'image' ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />
                      ) : file.type === 'video' ? (
                        <video src={file.url} controls preload="metadata" className="h-full w-full object-contain" aria-label={file.name} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-paper/60">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Video</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 p-4">
                      <p className="truncate text-sm font-semibold text-ink" title={file.name}>
                        {file.name}
                      </p>
                      <dl className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                        <div>
                          <dt>Tipo</dt>
                          <dd className="mt-0.5 text-ink">{file.type}</dd>
                        </div>
                        <div>
                          <dt>Tamaño</dt>
                          <dd className="mt-0.5 text-ink">{formatBytes(file.sizeBytes)}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt>Subida</dt>
                          <dd className="mt-0.5 text-ink">
                            {file.uploadedAt ? new Date(file.uploadedAt).toLocaleString('es-SV') : '—'}
                          </dd>
                        </div>
                      </dl>
                      <div className="flex flex-wrap gap-2">
                        <ActionLink to={paths.adminNoticias} variant="secondary">
                          Usar en noticia
                        </ActionLink>
                        <button type="button" onClick={() => void navigator.clipboard.writeText(file.url).then(() => push('success', 'URL copiada al portapapeles.')).catch(() => push('error', 'No se pudo copiar la URL.'))} className="border border-rule-strong px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink hover:border-ink">
                          Copiar URL
                        </button>
                        {isAdmin ? <button
                          type="button"
                          onClick={() => setFileToDelete(file)}
                          className="inline-flex items-center gap-2 border border-brand/30 bg-brand-soft/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-dark transition-colors hover:bg-brand-soft"
                        >
                          Eliminar
                        </button> : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </Container>

      <AdminToastProvider>
        <ConfirmDialog
          isOpen={fileToDelete !== null}
          onClose={() => setFileToDelete(null)}
          onConfirm={() => void handleDelete()}
          title="Eliminar archivo"
          message={
            <>
              Se eliminará <strong>{fileToDelete?.name}</strong> desde Supabase Storage. Los artículos
              que lo referencian dejarán de mostrar la imagen.
            </>
          }
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          isSubmitting={isDeleting}
        />
      </AdminToastProvider>
    </>
  )
}
