import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Container } from '@/components/common/Container'
import { PageHeader } from '@/components/common/PageHeader'
import { PageLoading } from '@/components/common/PageLoading'
import { Seo } from '@/components/seo/Seo'
import { paths } from '@/routes/paths'
import { ActionLink } from '@/components/common/ActionLink'
import { fetchAdminArticleById } from '@/services/content'
import type { AdminArticleRow } from '@/services/content'
import { ArticleEditorForm } from '@/components/admin/ArticleEditorForm'
import { ArticleAnalyticsPanel } from '@/components/admin/ArticleAnalyticsPanel'

export default function AdminEditArticlePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<AdminArticleRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    if (!id) {
      return
    }

    setIsLoading(true)

    fetchAdminArticleById(id)
      .then((result) => {
        if (!cancelled) {
          setArticle(result)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (isLoading) {
    return (
      <>
        <Seo title="Editando noticia" path={paths.adminNoticias} noIndex />
        <Container className="py-10">
          <PageLoading />
        </Container>
      </>
    )
  }

  if (!article) {
    return (
      <>
        <Seo title="Noticia no encontrada" path={paths.adminNoticias} noIndex />
        <Container className="py-10">
          <div className="max-w-xl border border-rule bg-paper-strong p-8 text-center">
            <h1 className="font-serif text-3xl font-semibold">Esta noticia no existe.</h1>
            <p className="mt-3 text-sm text-ink-muted">
              Puede que haya sido eliminada o que el enlace no sea válido.
            </p>
            <div className="mt-6">
              <ActionLink to={paths.adminNoticias}>Volver al listado</ActionLink>
            </div>
          </div>
        </Container>
      </>
    )
  }

  return (
    <>
      <Seo title={`Editando: ${article.title}`} path={paths.adminNoticias} noIndex />

      <PageHeader
        kicker="Contenido · Noticias"
        title="Editar noticia"
        description="Ajusta la redacción, el estado y los datos de publicación."
        breadcrumbs={[
          { label: 'Panel', to: paths.admin },
          { label: 'Noticias', to: paths.adminNoticias },
          { label: 'Editar' },
        ]}
        children={
          <ActionLink to={paths.adminNoticias} variant="secondary">
            Volver al listado
          </ActionLink>
        }
      />

      <Container className="py-8 lg:py-12">
        <ArticleAnalyticsPanel articleId={article.id} total={article.viewsCount} />
        <ArticleEditorForm
          key={article.id}
          articleId={article.id}
          initialArticle={article}
          onSaved={() => navigate(paths.adminNoticias)}
          onCancel={() => navigate(paths.adminNoticias)}
        />
      </Container>
    </>
  )
}
