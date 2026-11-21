import { Container } from '@/components/common/Container'
import { ContentSection } from '@/components/common/ContentSection'
import { PageHeader } from '@/components/common/PageHeader'
import { Seo } from '@/components/seo/Seo'
import { paths } from '@/routes/paths'

export default function PrivacyPage() {
  return <>
    <Seo title="Privacidad" description="Información sobre los datos tratados por Prensa Metapán." path={paths.privacy} />
    <PageHeader kicker="Legal" title="Privacidad" description="Datos tratados al usar el portal y sus funciones editoriales." breadcrumbs={[{ label: 'Inicio', to: paths.home }, { label: 'Privacidad' }]} />
    <section><Container className="max-w-3xl space-y-9 py-12 lg:py-16">
      <ContentSection title="Contenido y comentarios"><p>Supabase almacena el archivo editorial, los datos de autenticación del equipo y los comentarios enviados por lectores. El formulario público solicita nombre y comentario; no solicita correo. Los comentarios quedan pendientes hasta su moderación. El equipo administrativo puede consultar y moderar estos datos.</p></ContentSection>
      <ContentSection title="Estadísticas del portal"><p>Las métricas propias registran ruta visitada, fecha, vistas de noticias e interacciones con anuncios. El navegador guarda un identificador aleatorio en localStorage; la base de datos conserva su hash, no el identificador en claro ni direcciones IP. Se usa para deduplicar eventos y estimar visitantes. El conteo se limita para que re-renderizados no repitan impresiones o vistas.</p><p>Las estadísticas detalladas solo están disponibles para administradores.</p></ContentSection>
      <ContentSection title="Publicidad"><p>Los anuncios propios llevan una etiqueta visible, abren su destino en una pestaña segura y registran impresiones al entrar en pantalla y clics al seleccionarlos. El sitio no carga scripts de Google AdSense ni de redes publicitarias externas.</p></ContentSection>
      <ContentSection title="Servicios y seguridad"><p>El portal utiliza Supabase para autenticación, base de datos y almacenamiento. La clave pública del proyecto solo opera con permisos definidos por RLS; no se expone una clave service_role. La verificación de Google Search Console usa una etiqueta pública de sitio y no concede acceso a datos privados.</p></ContentSection>
      <ContentSection title="Cambios y contacto"><p>La política debe revisarse cuando cambien las funciones o las obligaciones legales aplicables. Los canales oficiales de contacto se publican en la página de contacto del portal.</p></ContentSection>
    </Container></section>
  </>
}
