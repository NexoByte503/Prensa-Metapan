import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const siteName = 'Prensa Metapán'
export const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
export const safeHttpUrl = (value) => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '' } catch { return '' } }
export const plainParagraphs = (html = '') => {
  const text = String(html).replace(/<(script|style|iframe|object|svg|form)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(?:p|h[1-6]|li|blockquote|div|pre|figure)\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '').replace(/\r/g, '').split('\n').map((part) => part.replace(/\s+/g, ' ').trim()).filter(Boolean)
  return text.map((part) => `<p>${escapeHtml(part)}</p>`).join('')
}
const meta = (property, name, content) => `<meta ${property}="${escapeHtml(name)}" content="${escapeHtml(content)}">`

export default async function handler(request, response) {
  const requestUrl = new URL(request.url || '/', `https://${request.headers['x-forwarded-host'] || request.headers.host || 'localhost'}`)
  const slug = String(requestUrl.searchParams.get('slug') || '').slice(0, 180)
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !supabaseUrl || !anonKey) {
    response.status(503).send('El artículo no está disponible temporalmente.')
    return
  }
  const query = new URL('/rest/v1/articles', supabaseUrl)
  query.searchParams.set('select', 'title,slug,subtitle,excerpt,content,featured_image,featured_image_alt,seo_title,seo_description,og_image,published_at,updated_at,category:categories!articles_category_id_fkey(name,slug),author:profiles!articles_author_id_fkey(full_name)')
  query.searchParams.set('slug', `eq.${slug}`); query.searchParams.set('status', 'eq.published'); query.searchParams.set('published_at', `lte.${new Date().toISOString()}`); query.searchParams.set('limit', '1')
  const articleResponse = await fetch(query, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }).catch(() => null)
  const rows = articleResponse?.ok ? await articleResponse.json().catch(() => []) : []
  const article = rows[0]
  if (!article) { response.status(404).send('Noticia no encontrada.'); return }

  const origin = process.env.VITE_SITE_URL ? new URL(process.env.VITE_SITE_URL).origin : `https://${request.headers['x-forwarded-host'] || request.headers.host}`
  const canonical = new URL(`/noticias/${encodeURIComponent(article.slug)}`, origin).toString()
  const title = String(article.seo_title || article.title).slice(0, 70)
  const description = String(article.seo_description || article.excerpt || article.subtitle || article.title).slice(0, 180)
  const image = safeHttpUrl(article.og_image || article.featured_image || '')
  const category = Array.isArray(article.category) ? article.category[0] : article.category
  const author = Array.isArray(article.author) ? article.author[0] : article.author
  const publishedDate = article.published_at
  const modifiedDate = article.updated_at || publishedDate
  const jsonLd = { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: article.title, description, ...(image ? { image: [image] } : {}), datePublished: publishedDate, dateModified: modifiedDate, ...(author?.full_name ? { author: { '@type': 'Person', name: author.full_name } } : {}), publisher: { '@type': 'Organization', name: siteName, url: origin }, mainEntityOfPage: { '@type': 'WebPage', '@id': canonical } }
  const crumbData = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Inicio', item: origin }, { '@type': 'ListItem', position: 2, name: 'Noticias', item: new URL('/noticias', origin).toString() }, ...(category ? [{ '@type': 'ListItem', position: 3, name: category.name, item: new URL(`/categorias/${encodeURIComponent(category.slug)}`, origin).toString() }] : []), { '@type': 'ListItem', position: category ? 4 : 3, name: article.title, item: canonical }] }
  let html
  try { html = readFileSync(join(process.cwd(), 'dist/index.html'), 'utf8') } catch { response.status(503).send('No se pudo preparar la página.'); return }
  html = html.replace(/<meta\b(?=[^>]*(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+"))[^>]*>/gi, '')
    .replace(/<link\b(?=[^>]*rel="canonical")[^>]*>/gi, '')
    .replace(/<script\b(?=[^>]*type="application\/ld\+json")[^>]*>[\s\S]*?<\/script>/gi, '')
  const imageHtml = image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(article.featured_image_alt || article.title)}" fetchpriority="high" style="max-width:100%;height:auto">` : ''
  const body = `<div id="root" data-server-article="true"><main style="max-width:980px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif;color:#172b2d"><nav aria-label="Ruta de navegación"><a href="/">Inicio</a> / <a href="/noticias">Noticias</a>${category ? ` / <a href="/categorias/${escapeHtml(encodeURIComponent(category.slug))}">${escapeHtml(category.name)}</a>` : ''}</nav><article><header><p>${category ? escapeHtml(category.name) + ' · ' : ''}<time datetime="${escapeHtml(publishedDate)}">${escapeHtml(new Intl.DateTimeFormat('es-SV', { dateStyle: 'long', timeZone: 'America/El_Salvador' }).format(new Date(publishedDate)))}</time></p><h1>${escapeHtml(article.title)}</h1>${article.subtitle ? `<p>${escapeHtml(article.subtitle)}</p>` : ''}${article.excerpt ? `<p>${escapeHtml(article.excerpt)}</p>` : ''}${author?.full_name ? `<p>Por ${escapeHtml(author.full_name)}</p>` : ''}${imageHtml}</header><div>${plainParagraphs(article.content)}</div></article><p><a href="/noticias">Volver a todas las noticias</a></p></main></div>`
  html = html.replace('<div id="root"></div>', body)
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)} | ${siteName}</title>`)
    .replace('</head>', `${meta('name', 'description', description)}${meta('name', 'robots', process.env.VITE_SITE_INDEXABLE === 'true' ? 'index, follow' : 'noindex, nofollow')}${meta('property', 'og:title', `${title} | ${siteName}`)}${meta('property', 'og:description', description)}${meta('property', 'og:type', 'article')}${meta('property', 'og:url', canonical)}${image ? meta('property', 'og:image', image) : ''}${meta('name', 'twitter:card', 'summary_large_image')}${meta('name', 'twitter:title', `${title} | ${siteName}`)}${meta('name', 'twitter:description', description)}${image ? meta('name', 'twitter:image', image) : ''}<link rel="canonical" href="${escapeHtml(canonical)}"><script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script><script type="application/ld+json">${JSON.stringify(crumbData).replace(/</g, '\\u003c')}</script></head>`)
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  response.status(200).send(html)
}
