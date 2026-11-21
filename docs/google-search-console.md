# Configurar Google Search Console

## 1. Preparar el dominio

En Vercel, asigna el dominio definitivo al proyecto y configura estas variables para Production y Preview según corresponda:

- `VITE_SITE_URL`: URL canónica pública, por ejemplo `https://prensametapan.com` (sin barra final).
- `VITE_SITE_INDEXABLE`: usa `true` solo cuando el sitio esté listo para publicarse e indexarse; mientras siga en preparación, déjalo en `false`.
- `VITE_GOOGLE_SITE_VERIFICATION`: valor que entrega Search Console para la verificación mediante etiqueta HTML. No escribas aquí una credencial de API.
- `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`: variables públicas ya usadas por el portal. Nunca configures `service_role` con prefijo `VITE_`.

Después de guardar variables, crea un despliegue de Vercel para que el build y las funciones usen la configuración actualizada.

## 2. Verificar la propiedad

1. Entra a [Google Search Console](https://search.google.com/search-console/) y agrega el dominio como propiedad. La propiedad de dominio puede pedir un registro DNS; el método de prefijo de URL permite elegir la etiqueta HTML.
2. Si eliges etiqueta HTML, copia solo el valor de verificación y guárdalo en `VITE_GOOGLE_SITE_VERIFICATION` en Vercel.
3. Despliega el proyecto y abre el código fuente de la página principal para comprobar que aparece `meta name="google-site-verification"` con ese valor.
4. Pulsa **Verificar** en Search Console. No se considera verificado hasta que Google confirme el método.

## 3. Enviar y revisar el sitemap

El endpoint dinámico `/sitemap.xml` reúne páginas institucionales, categorías y artículos publicados cuyo horario ya llegó. Excluye artículos no publicados y rutas administrativas. `/robots.txt` publica el enlace al sitemap y bloquea `/admin` y `/buscar`; con `VITE_SITE_INDEXABLE=false` bloquea temporalmente todo el rastreo.

1. Abre `https://TU-DOMINIO/sitemap.xml` y confirma que devuelve XML válido.
2. En Search Console, abre **Sitemaps**, escribe `sitemap.xml` y envíalo.
3. Revisa el estado y la fecha de lectura del sitemap. La respuesta puede usar caché de hasta cinco minutos.

## 4. Comprobar una noticia

1. Abre la URL pública y usa **Inspección de URL** en Search Console.
2. Comprueba canonical, disponibilidad de rastreo y el HTML que Google procesó. En Vercel las rutas `/noticias/:slug` sirven un documento inicial con contenido, título, canonical, Open Graph y JSON-LD de `NewsArticle`.
3. Si la noticia ya está publicada y cumple los criterios de Google, usa **Solicitar indexación**. Esto envía una solicitud, no garantiza indexación ni una posición concreta.

## 5. Cobertura y rendimiento

- En **Indexación → Páginas**, revisa excluidas, errores de servidor, duplicados y canonicals alternativos.
- En **Rendimiento → Resultados de búsqueda**, revisa clics, impresiones, CTR, posición, consultas, páginas y países; compara periodos antes de cambiar titulares.
- Usa **Inspección de URL** para validar una página individual y revisar la fecha del último rastreo.
- Search Console no está conectado a una API de métricas en este proyecto; sus datos se consultan en la interfaz de Google.

La verificación, el envío del sitemap y la indexación son tareas externas y no se consideran completadas por el código del sitio.
