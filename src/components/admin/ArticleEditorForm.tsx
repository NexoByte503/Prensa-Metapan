import { zodResolver } from '@hookform/resolvers/zod'
import {
  Bold,
  Quote,
  Eye,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Video,
} from 'lucide-react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { Editor as TiptapEditor } from '@tiptap/core'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useAdminToast } from '@/components/admin/AdminToast'
import { AdminModal } from '@/components/admin/AdminModal'
import { createArticleEditorExtensions } from '@/components/admin/editor/editorExtensions'
import { ActionLink } from '@/components/common/ActionLink'
import { Seo } from '@/components/seo/Seo'
import { useAuth } from '@/hooks'
import { paths } from '@/routes/paths'
import {
  createArticle,
  fetchAllTags,
  updateArticle,
  type AdminArticleRow,
  type SaveArticleInput,
} from '@/services/content'
import { fetchCategories } from '@/services/content/categories'
import { sanitizeHtml } from '@/utils/sanitize'
import { slugify } from '@/utils/slug'
import { toSafeVideoEmbedUrl } from '@/utils/video'
import { listEditorialFiles, EDITORIAL_STORAGE_BUCKETS, type EditorialMediaFile } from '@/services/multimedia'

const articleEditorSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'El título debe tener al menos 3 caracteres.')
      .max(250, 'El título no puede exceder 250 caracteres.'),
    slug: z
      .string()
      .trim()
      .min(1, 'El slug es obligatorio.')
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Usa minúsculas, números y guiones.'),
    featuredImage: z.union([z.string().url('Escribe una URL válida.'), z.literal('')]).optional(),
    subtitle: z.string().trim().max(300).nullable().optional(),
    excerpt: z.string().trim().max(600).nullable().optional(),
    seoTitle: z.string().trim().max(70).optional(),
    seoDescription: z.string().trim().max(180).optional(),
    ogImage: z.union([z.string().url('Escribe una URL válida.'), z.literal('')]).optional(),
    featuredImageAlt: z.string().trim().max(300).optional(),
    content: z.string().min(1, 'Escribe el contenido de la noticia.'),
    categoryId: z.string().min(1, 'Selecciona una categoría.'),
    authorId: z.string().min(1, 'Selecciona el autor.'),
    status: z.enum(['draft', 'review', 'published', 'archived']),
    publishedAt: z.string().optional(),
    isFeatured: z.boolean(),
    isBreaking: z.boolean(),
    tagIds: z.array(z.string()),
  })
  .superRefine((values, ctx) => {
    if (values.status !== 'published') {
      return
    }

    const contentLength = values.content.replace(/<[^>]*>/g, '').trim().length

    if (contentLength < 10) {
      ctx.addIssue({
        code: 'custom',
        path: ['content'],
        message: 'La publicación requiere contenido sustancial antes de guardarse.',
      })
    }

    if (!values.publishedAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['publishedAt'],
        message: 'Selecciona la fecha y hora de publicación.',
      })
    }
  })

type ArticleEditorValues = z.infer<typeof articleEditorSchema>
type ArticleEditorSaveStatus = 'draft' | 'review' | 'published' | 'archived'

interface ArticleEditorFormProps {
  readonly articleId?: string | null
  readonly initialArticle?: AdminArticleRow | null
  readonly onSaved: (article: AdminArticleRow) => void
  readonly onCancel: () => void
}

interface CategoryOption {
  readonly id: string
  readonly name: string
}

interface AuthorOption {
  readonly id: string
  readonly fullName: string
}

interface EditorImageState {
  readonly src: string
  readonly alt: string
  readonly caption: string
}

const emptyEditorImage: EditorImageState = {
  src: '',
  alt: '',
  caption: '',
}

const initialEditorImage: EditorImageState = {
  src: '',
  alt: '',
  caption: '',
}

function EditorToolbar({
  editor,
  onInsertImage,
  onInsertLink,
  onInsertVideo,
}: {
  editor: TiptapEditor | null
  onInsertImage: () => void
  onInsertLink: () => void
  onInsertVideo: () => void
}) {
  if (!editor) {
    return null
  }

  const buttonClassName =
    'inline-flex h-9 w-9 items-center justify-center border border-night-rule bg-night text-paper/70 transition-colors hover:border-white/50 hover:text-paper'

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        aria-label="Deshacer"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().undo().run()}
        className={buttonClassName}
      >
        <Undo2 aria-hidden="true" size={14} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        aria-label="Rehacer"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().redo().run()}
        className={buttonClassName}
      >
        <Redo2 aria-hidden="true" size={14} strokeWidth={1.8} />
      </button>
      <span className="mx-1 h-6 w-px bg-night-rule" aria-hidden="true" />
      <button
        type="button"
        aria-label="Negrita"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClassName}
      >
        <Bold aria-hidden="true" size={14} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label="Cursiva"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClassName}
      >
        <Italic aria-hidden="true" size={14} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label="Tachado"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={buttonClassName}
      >
        <Strikethrough aria-hidden="true" size={14} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label="Subrayado"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={buttonClassName}
      >
        <Underline aria-hidden="true" size={14} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label="Subtítulo"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClassName}
      >
        <Heading2 aria-hidden="true" size={14} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label="Subtítulo secundario"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={buttonClassName}
      >
        <Heading3 aria-hidden="true" size={14} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label="Cita"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={buttonClassName}
      >
        <Quote aria-hidden="true" size={14} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        aria-label="Lista desordenada"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClassName}
      >
        <List aria-hidden="true" size={14} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        aria-label="Lista ordenada"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClassName}
      >
        <ListOrdered aria-hidden="true" size={14} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        aria-label="Separador"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().insertContent({ type: 'horizontalRule' }).run()}
        className={buttonClassName}
      >
        <Minus aria-hidden="true" size={14} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label="Insertar imagen"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onInsertImage}
        className="inline-flex h-9 items-center gap-1.5 border border-night-rule bg-night px-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-paper/70 transition-colors hover:border-white/50 hover:text-paper"
      >
        <ImageIcon aria-hidden="true" size={13} strokeWidth={1.8} />
        Imagen
      </button>
      <button
        type="button"
        aria-label="Insertar enlace"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onInsertLink}
        className="inline-flex h-9 items-center gap-1.5 border border-night-rule bg-night px-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-paper/70 transition-colors hover:border-white/50 hover:text-paper"
      >
        <LinkIcon aria-hidden="true" size={13} strokeWidth={1.8} />
        Enlace
      </button>
      <button type="button" aria-label="Insertar video" onMouseDown={(event) => event.preventDefault()} onClick={onInsertVideo} className="inline-flex h-9 items-center gap-1.5 border border-night-rule bg-night px-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-paper/70 hover:border-white/50 hover:text-paper">
        <Video aria-hidden="true" size={13} /> Video
      </button>
    </div>
  )
}

export function ArticleEditorForm({
  articleId,
  initialArticle,
  onSaved,
  onCancel,
}: ArticleEditorFormProps) {
  const { profile } = useAuth()
  const { push } = useAdminToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [imageState, setImageState] = useState<EditorImageState>(initialEditorImage)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkHref, setLinkHref] = useState('https://')
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [libraryImages, setLibraryImages] = useState<EditorialMediaFile[]>([])
  const [loadingLibrary, setLoadingLibrary] = useState(false)

  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([])

  const initialContent = initialArticle?.content ?? '<p></p>'

  useEffect(() => {
    let cancelled = false

    fetchCategories()
      .then((result) => {
        if (!cancelled) {
          setCategories(result.map((category) => ({ id: category.id, name: category.name })))
        }
      })
      .catch(() => {
        // Sin categorías registradas el selector se completa con las opciones vacías.
      })

    fetchAllTags()
      .then((result) => {
        if (!cancelled) {
          setTags(result.map((tag) => ({ id: tag.id, name: tag.name })))
        }
      })
      .catch(() => {
        // Las etiquetas son opcionales; ante error se conservan sin selección.
      })

    return () => {
      cancelled = true
    }
  }, [])

  const authorOptions = useMemo<AuthorOption[]>(() => {
    const options: AuthorOption[] = []

    if (initialArticle?.author) {
      options.push({
        id: initialArticle.author.id,
        fullName: initialArticle.author.fullName,
      })
    }

    if (profile?.id && !options.some((option) => option.id === profile.id)) {
      options.push({
        id: profile.id,
        fullName: profile.full_name,
      })
    }

    return options
  }, [initialArticle, profile])

  const {
    register,
    setValue,
    getValues,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ArticleEditorValues>({
    resolver: zodResolver(articleEditorSchema),
    defaultValues: {
      title: initialArticle?.title ?? '',
      slug: initialArticle?.slug ?? '',
      featuredImage: initialArticle?.featuredImage ?? '',
      subtitle: initialArticle?.subtitle ?? null,
      excerpt: initialArticle?.excerpt ?? null,
      seoTitle: initialArticle?.seoTitle ?? '',
      seoDescription: initialArticle?.seoDescription ?? '',
      ogImage: initialArticle?.ogImage ?? '',
      featuredImageAlt: initialArticle?.featuredImageAlt ?? '',
      content: initialArticle?.content ?? '<p></p>',
      categoryId: initialArticle?.category?.id ?? '',
      authorId: initialArticle?.author?.id ?? profile?.id ?? '',
      status: initialArticle?.status ?? 'draft',
      publishedAt: initialArticle?.publishedAt
        ? new Date(initialArticle.publishedAt).toISOString().slice(0, 16)
        : '',
      isFeatured: initialArticle?.isFeatured ?? false,
      isBreaking: initialArticle?.isBreaking ?? false,
      tagIds: [],
    },
  })

  const editor = useEditor(
    {
      extensions: createArticleEditorExtensions(),
      content: initialContent,
    },
    [articleId],
  )

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return
    }
    editor.commands.setContent(initialContent, { emitUpdate: false })
  }, [editor, initialContent])

  useEffect(() => {
    if (!editor) {
      return
    }
    const handleUpdate = () => {
      setValue('content', editor.getHTML(), { shouldValidate: true })
    }
    editor.on('update', handleUpdate)
    return () => {
      editor.off('update', handleUpdate)
    }
  }, [editor, setValue])

  const watchedValues = watch()
  const previewHtml = useMemo(() => sanitizeHtml(watchedValues.content ?? ''), [watchedValues.content])

  async function executeSave(targetStatus: ArticleEditorSaveStatus): Promise<void> {
    if (targetStatus === 'published' && !getValues('publishedAt')) {
      setValue('publishedAt', new Date().toISOString().slice(0, 16), { shouldValidate: true })
    }
    setValue('status', targetStatus, { shouldValidate: true })
    const isValid = await trigger()

    if (!isValid) {
      return
    }

    const values = getValues()
    const content = editor?.getHTML() ?? values.content ?? ''

    const publishedAt =
      targetStatus === 'published'
        ? values.publishedAt
          ? new Date(values.publishedAt).toISOString()
          : new Date().toISOString()
        : null

    const input: SaveArticleInput = {
      title: values.title,
      slug: values.slug,
      subtitle: values.subtitle ?? null,
      content: sanitizeHtml(content),
      excerpt: values.excerpt ?? null,
              featuredImage: values.featuredImage?.trim() || null,
      featuredImageAlt: values.featuredImageAlt?.trim() || null,
      seoTitle: values.seoTitle?.trim() || null,
      seoDescription: values.seoDescription?.trim() || null,
      ogImage: values.ogImage?.trim() || null,
      categoryId: values.categoryId,
      authorId: values.authorId,
      status: targetStatus,
      isFeatured: values.isFeatured,
      isBreaking: values.isBreaking,
      publishedAt,
      tagIds: values.tagIds,
    }

    setIsSaving(true)

    try {
      const saved =
        articleId
          ? await updateArticle(articleId, input)
          : await createArticle(input)

      push(
        'success',
        targetStatus === 'published'
          ? 'La noticia se publicó correctamente.'
          : 'El borrador se guardó correctamente.',
      )

      onSaved(saved)
    } catch (error) {
      push('error', error instanceof Error ? error.message : 'No se pudo guardar la noticia.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveDraft(): Promise<void> {
    await executeSave('draft')
  }

  async function handlePublish(): Promise<void> {
    setValue('publishedAt', new Date().toISOString().slice(0, 16), { shouldValidate: true })
    await executeSave('published')
  }

  async function handleSchedule(): Promise<void> {
    const selectedDate = getValues('publishedAt')
    if (!selectedDate || new Date(selectedDate).getTime() <= Date.now()) {
      push('error', 'Selecciona una fecha y hora futura para programar la noticia.')
      return
    }
    await executeSave('published')
  }

  function handleInsertImage(): void {
    const src = imageState.src.trim()

    if (!src) {
      return
    }

    editor
      ?.chain()
      .focus()
      .setFigure({
        src,
        alt: imageState.alt.trim() || null,
        caption: imageState.caption.trim() || null,
      })
      .run()

    setImageModalOpen(false)
    setImageState(emptyEditorImage)
  }

  function handleInsertLink(): void {
    const href = linkHref.trim()

    if (!href) {
      return
    }

    editor
      ?.chain()
      .focus()
      .setLink({
        href,
        target: '_blank',
        rel: 'noopener noreferrer',
      })
      .run()

    setLinkModalOpen(false)
    setLinkHref('https://')
  }

  async function openImageLibrary(): Promise<void> {
    setLoadingLibrary(true)
    setLibraryOpen(true)
    try {
      const files = await listEditorialFiles(EDITORIAL_STORAGE_BUCKETS.articleImages, { types: ['image'], limit: 100 })
      setLibraryImages(files)
    } catch (error) {
      push('error', error instanceof Error ? error.message : 'No se pudo cargar la biblioteca de imágenes.')
    } finally {
      setLoadingLibrary(false)
    }
  }

  function handleInsertVideo(): void {
    const embedUrl = toSafeVideoEmbedUrl(videoUrl)
    if (!embedUrl) {
      push('error', 'Usa un enlace válido de YouTube o Vimeo.')
      return
    }
    editor?.chain().focus().setVideoEmbed({ src: embedUrl }).run()
    setVideoModalOpen(false)
    setVideoUrl('')
  }

  if (isPreview) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className="border border-rule-strong bg-paper-strong px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-paper"
          >
            Volver al editor
          </button>
          <ActionLink to={paths.admin}>Salir del panel</ActionLink>
        </div>

        <div className="border border-rule bg-paper-strong p-6 shadow-editorial sm:p-10">
          <Seo title={watchedValues.title} path={paths.admin} noIndex />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
            Vista previa
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.03em]">
            {watchedValues.title}
          </h1>
          {watchedValues.subtitle ? (
            <p className="mt-3 text-lg text-ink-muted">{watchedValues.subtitle}</p>
          ) : null}
          {watchedValues.excerpt ? (
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">{watchedValues.excerpt}</p>
          ) : null}
          {previewHtml ? (
            <div
              className="prose mt-8 max-w-none"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : null}
        </div>
      </div>
    )
  }

  if (!editor) {
    return <p className="text-sm text-ink-muted">Inicializando el editor…</p>
  }

  const inputClassName =
    'mt-2 h-12 w-full border border-rule-strong bg-paper-strong px-3.5 text-sm text-ink placeholder:text-ink-muted/60 focus:border-brand focus:outline-none'

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="article-title"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
            >
              Título
            </label>
            <input id="article-title" type="text" className={inputClassName} {...register('title', { onChange: (event) => setValue('slug', slugify(event.target.value), { shouldValidate: true }) })} />
            {errors.title ? (
              <p role="alert" className="mt-2 text-xs text-brand">
                {errors.title.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="article-slug"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
            >
              Slug
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="article-slug"
                type="text"
                className={`${inputClassName} font-mono text-xs`}
                {...register('slug')}
              />
              <button
                type="button"
                onClick={() => setValue('slug', slugify(watchedValues.title) || '', { shouldValidate: true })}
                className="border border-rule-strong bg-paper-strong px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink hover:bg-paper"
              >
                Regenerar
              </button>
            </div>
            {errors.slug ? (
              <p role="alert" className="mt-2 text-xs text-brand">
                {errors.slug.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="article-subtitle"
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
              >
                Subtítulo
              </label>
              <input
                id="article-subtitle"
                type="text"
                className={inputClassName}
                {...register('subtitle')}
              />
            </div>
            <div>
              <label
                htmlFor="article-excerpt"
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
              >
                Extracto
              </label>
              <textarea id="article-excerpt" rows={2} className={inputClassName} {...register('excerpt')} />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="article-category"
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
              >
                Categoría
              </label>
              <select
                id="article-category"
                className={inputClassName}
                {...register('categoryId')}
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId ? (
                <p role="alert" className="mt-2 text-xs text-brand">
                  {errors.categoryId.message}
                </p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="article-author"
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
              >
                Autor
              </label>
              <select id="article-author" className={inputClassName} {...register('authorId')}>
                <option value="">Selecciona el autor</option>
                {authorOptions.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.fullName}
                  </option>
                ))}
              </select>
              {errors.authorId ? (
                <p role="alert" className="mt-2 text-xs text-brand">
                  {errors.authorId.message}
                </p>
              ) : null}
            </div>
          </div>

          {tags.length > 0 ? (
            <fieldset>
              <legend className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Etiquetas
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isChecked = watchedValues.tagIds?.includes(tag.id) ?? false

                  return (
                    <label
                      key={tag.id}
                      className="inline-flex items-center gap-2 border border-rule-strong bg-paper-strong px-3 py-2 text-xs text-ink"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[var(--color-brand)]"
                        checked={isChecked}
                        onChange={(event) => {
                          const nextValue = event.target.checked
                            ? [...(watchedValues.tagIds ?? [])]
                            : (watchedValues.tagIds ?? []).filter((id) => id !== tag.id)
                          setValue('tagIds', nextValue, { shouldValidate: true })
                        }}
                      />
                      {tag.name}
                    </label>
                  )
                })}
              </div>
            </fieldset>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="border border-rule bg-paper-strong p-4">
            <label htmlFor="article-featured-image" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Imagen destacada</label>
            <input id="article-featured-image" type="url" placeholder="https://…" className={inputClassName} {...register('featuredImage')} />
            {watchedValues.featuredImage ? <img src={watchedValues.featuredImage} alt="Vista previa de imagen destacada" className="mt-3 aspect-video w-full object-cover" /> : null}
            <label htmlFor="article-featured-alt" className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Texto alternativo de imagen</label>
            <input id="article-featured-alt" maxLength={300} className={inputClassName} {...register('featuredImageAlt')} />
            <button type="button" onClick={() => void openImageLibrary()} className="mt-3 border border-rule-strong px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink hover:border-ink">Elegir de la biblioteca</button>
            {errors.featuredImage ? <p role="alert" className="mt-2 text-xs text-brand">{errors.featuredImage.message}</p> : null}
          </div>
          <fieldset className="space-y-3 border border-rule bg-paper-strong p-4">
            <legend className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">SEO y vista previa social</legend>
            <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Meta title <input maxLength={70} className={inputClassName} {...register('seoTitle')} /></label>
            <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Meta description <textarea rows={3} maxLength={180} className={inputClassName} {...register('seoDescription')} /></label>
            <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Imagen Open Graph <input type="url" placeholder="Usa la imagen destacada si se deja vacío" className={inputClassName} {...register('ogImage')} /></label>
            <p className="text-[10px] text-ink-muted">Si los campos quedan vacíos se usarán el título, extracto y la imagen de portada.</p>
          </fieldset>
          <div>
            <label
              htmlFor="article-status"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
            >
              Estado
            </label>
            <select id="article-status" className={inputClassName} {...register('status')}>
              <option value="draft">Borrador</option>
              <option value="review">En revisión</option>
              <option value="published">Publicada</option>
              <option value="archived">Archivada</option>
            </select>

            <label
              htmlFor="article-published-at"
              className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
            >
              Fecha de publicación
            </label>
            <input
              id="article-published-at"
              type="datetime-local"
              className={inputClassName}
              {...register('publishedAt')}
            />
            {errors.publishedAt ? (
              <p role="alert" className="mt-2 text-xs text-brand">
                {errors.publishedAt.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-xs text-ink">
              <input type="checkbox" className="h-4 w-4 accent-[var(--color-brand)]" {...register('isFeatured')} />
              Destacada
            </label>
            <label className="flex items-center gap-2 text-xs text-ink">
              <input type="checkbox" className="h-4 w-4 accent-[var(--color-brand)]" {...register('isBreaking')} />
              Última hora
            </label>
          </div>

          <div className="border border-rule bg-paper-strong p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              Acciones
            </p>
            <div className="mt-4 grid gap-2.5">
              <button
                type="button"
                onClick={() => void handleSaveDraft()}
                disabled={isSaving}
                className="border border-rule-strong bg-paper-strong px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
              >
                Guardar borrador
              </button>
              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={isSaving}
                className="bg-brand px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                Publicar noticia
              </button>
              <button
                type="button"
                onClick={() => void handleSchedule()}
                disabled={isSaving}
                className="border border-brand/40 bg-brand-soft/50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-dark transition-colors hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                Programar publicación
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            Contenido
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreview(true)}
              className="inline-flex items-center gap-2 border border-rule-strong bg-paper-strong px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink hover:bg-paper"
            >
              <Eye aria-hidden="true" size={13} strokeWidth={1.8} />
              Vista previa
            </button>
          </div>
        </div>

        <div className="editor-surface mt-3 min-h-72 border border-rule bg-paper-strong p-4 shadow-editorial">
          <EditorContent editor={editor} className="min-h-64" />
        </div>

        <div className="mt-3">
          <EditorToolbar
            editor={editor}
            onInsertImage={() => setImageModalOpen(true)}
            onInsertLink={() => setLinkModalOpen(true)}
            onInsertVideo={() => setVideoModalOpen(true)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="border border-rule-strong bg-paper-strong px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-paper"
        >
          Cancelar
        </button>
        <p className="text-[10px] uppercase tracking-[0.12em] text-ink-muted">
          {isSaving ? 'Guardando…' : 'Guarda para habilitar publicación'}
        </p>
      </div>

      <AdminModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        title="Insertar imagen"
        description="La imagen se inserta con su pie de fotografía en el contenido."
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="editor-image-src"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
            >
              URL de la imagen
            </label>
            <input
              id="editor-image-src"
              type="url"
              className={inputClassName}
              value={imageState.src}
              onChange={(event) => setImageState({ ...imageState, src: event.target.value })}
            />
          </div>
          <div>
            <label
              htmlFor="editor-image-alt"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
            >
              Texto alternativo
            </label>
            <input
              id="editor-image-alt"
              type="text"
              className={inputClassName}
              value={imageState.alt}
              onChange={(event) => setImageState({ ...imageState, alt: event.target.value })}
            />
          </div>
          <div>
            <label
              htmlFor="editor-image-caption"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
            >
              Pie de fotografía
            </label>
            <textarea
              id="editor-image-caption"
              rows={2}
              className={inputClassName}
              value={imageState.caption}
              onChange={(event) => setImageState({ ...imageState, caption: event.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setImageModalOpen(false)}
              className="border border-rule-strong bg-paper-strong px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-paper"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleInsertImage}
              disabled={!imageState.src}
              className="bg-brand px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              Insertar
            </button>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        title="Insertar enlace"
        description="El enlace se abre en una pestaña segura del navegador."
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="editor-link-href"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted"
            >
              URL
            </label>
            <input
              id="editor-link-href"
              type="url"
              className={inputClassName}
              value={linkHref}
              onChange={(event) => setLinkHref(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setLinkModalOpen(false)}
              className="border border-rule-strong bg-paper-strong px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-paper"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleInsertLink}
              disabled={!linkHref.trim()}
              className="bg-brand px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              Insertar
            </button>
          </div>
        </div>
      </AdminModal>

      <AdminModal isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} title="Biblioteca de imágenes" description="Selecciona una imagen destacada ya cargada en Storage.">
        {loadingLibrary ? <p className="text-sm text-ink-muted">Cargando biblioteca…</p> : libraryImages.length ? <ul className="grid max-h-[60dvh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">{libraryImages.map((file) => <li key={file.path}><button type="button" onClick={() => { setValue('featuredImage', file.url, { shouldValidate: true }); setLibraryOpen(false) }} className="w-full border border-rule text-left hover:border-brand"><img src={file.url} alt={file.name} className="aspect-video w-full object-cover" /><span className="block truncate p-2 text-[10px] text-ink">{file.name}</span></button></li>)}</ul> : <p className="text-sm text-ink-muted">No hay imágenes en el bucket de noticias. Sube una desde Multimedia.</p>}
      </AdminModal>

      <AdminModal isOpen={videoModalOpen} onClose={() => setVideoModalOpen(false)} title="Insertar video" description="Pega un enlace de YouTube o Vimeo. Se insertará un reproductor seguro.">
        <div className="space-y-4"><label htmlFor="editor-video-url" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Enlace del video</label><input id="editor-video-url" type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://youtu.be/…" className={inputClassName} /><div className="flex justify-end"><button type="button" onClick={handleInsertVideo} disabled={!videoUrl.trim()} className="bg-brand px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-50">Insertar video</button></div></div>
      </AdminModal>
    </div>
  )
}
