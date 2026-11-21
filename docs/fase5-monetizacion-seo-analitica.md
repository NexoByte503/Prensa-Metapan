# Fase 5: publicidad, SEO y estadísticas

## Publicidad propia

La página administrativa `/admin/publicidad` administra campañas con imagen, destino HTTPS, ubicación, vigencia, prioridad y estado. Las creatividades se pueden subir al bucket `advertisements` en JPG, PNG, WebP o AVIF con límite de 10 MB. Los espacios del portal son `home_banner`, `header_banner`, `news_between`, `news_sidebar`, `article_inline` y `article_footer`. Un espacio sin campaña elegible no se renderiza.

Las campañas programadas pueden publicarse al llegar su fecha de inicio; la vigencia se valida también en RLS. El estado `paused` desactiva la publicación. Se registran impresiones al cruzar 50% de visibilidad y clics al abrir el enlace. La interfaz evita re-renderizados duplicados, el servidor deduplica impresiones por 30 segundos y clics en el mismo segundo. CTR es clics / impresiones × 100. Los patrocinadores locales aparecen identificados como publicidad.

No se carga Google AdSense ni se simulan anuncios. El componente `AdSlot` centraliza la futura sustitución o composición de proveedores si se configura AdSense con una aprobación e identificador reales.

## Analítica

`record_public_analytics_event` es el único canal público para eventos. Rechaza sesiones del equipo, valida tipo/ruta/objetivos, limita duplicados, y almacena solo SHA-256 del token aleatorio del navegador. No persiste IP, user agent, correo ni ruta con query de búsqueda. `analytics_events` no acepta escrituras directas ni lecturas públicas; un RPC reservado a administradores devuelve agregados. Las estadísticas nuevas comienzan al aplicar esta migración; `articles.views_count` conserva también su histórico previo.

## SEO y Vercel

El editor guarda meta title, meta description, Open Graph image y texto alternativo de portada. Sin valores personalizados, usa título, extracto/subtítulo e imagen destacada. La función Vercel `/api/article` proporciona un documento HTML inicial con texto de noticia, canonical, Open Graph, Twitter Cards, `NewsArticle` y `BreadcrumbList`; después carga la aplicación React. El endpoint dinámico `/sitemap.xml` actualiza noticias y categorías desde Supabase (caché de cinco minutos). `/robots.txt` respeta `VITE_SITE_INDEXABLE`, bloquea `/admin` y `/buscar`, y declara el sitemap.

## Despliegue

Aplica las migraciones Supabase en orden y despliega el proyecto en Vercel. Configura `VITE_SITE_URL`, `VITE_SITE_INDEXABLE`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Production; configura `VITE_GOOGLE_SITE_VERIFICATION` después de obtener el valor oficial de Search Console. Las variables públicas `VITE_*` nunca deben contener service role ni credenciales OAuth. `docs/google-search-console.md` contiene el procedimiento para verificar el dominio y enviar el sitemap.
