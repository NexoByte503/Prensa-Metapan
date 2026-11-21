import { useNavigate } from 'react-router-dom'

import { ActionLink } from '@/components/common/ActionLink'
import { Container } from '@/components/common/Container'
import { PageHeader } from '@/components/common/PageHeader'
import { Seo } from '@/components/seo/Seo'
import { paths } from '@/routes/paths'
import { ArticleEditorForm } from '@/components/admin/ArticleEditorForm'

export default function AdminNewArticlePage() {
  const navigate = useNavigate()

  return (
    <>
      <Seo title="Nueva noticia" path={paths.adminNoticias} noIndex />

      <PageHeader
        kicker="Contenido · Noticias"
        title="Nueva noticia"
        description="Redacta la nota, programa su publicación y publícala cuando el contenido esté listo."
        breadcrumbs={[
          { label: 'Panel', to: paths.admin },
          { label: 'Noticias' },
        ]}
        children={
          <ActionLink to={paths.adminNoticias} variant="secondary">
            Volver al listado
          </ActionLink>
        }
      />

      <Container className="py-8 lg:py-12">
        <ArticleEditorForm
          articleId={null}
          onSaved={() => navigate(paths.adminNoticias)}
          onCancel={() => navigate(paths.adminNoticias)}
        />
      </Container>
    </>
  )
}
