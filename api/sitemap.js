const xml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char])

export default async function handler(request, response) {
  const base = process.env.VITE_SITE_URL ? new URL(process.env.VITE_SITE_URL).origin : `https://${request.headers['x-forwarded-host'] || request.headers.host}`
  const staticPaths = ['/', '/noticias', '/quienes-somos', '/contacto', '/politica-editorial', '/privacidad', '/terminos']
  let categories = []
  let articles = []
  const projectUrl = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (projectUrl && key) {
    const headers = { apikey: key, Authorization: `Bearer ${key}` }
    const categoriesUrl = new URL('/rest/v1/categories', projectUrl); categoriesUrl.searchParams.set('select', 'slug,updated_at'); categoriesUrl.searchParams.set('order', 'name.asc')
    const [categoryResult] = await Promise.all([fetch(categoriesUrl, { headers }).catch(() => null)])
    if (categoryResult?.ok) categories = await categoryResult.json().catch(() => [])
    for (let offset = 0; offset < 50000; offset += 1000) {
      const articlesUrl = new URL('/rest/v1/articles', projectUrl)
      articlesUrl.searchParams.set('select', 'slug,published_at,updated_at'); articlesUrl.searchParams.set('status', 'eq.published'); articlesUrl.searchParams.set('published_at', `lte.${new Date().toISOString()}`); articlesUrl.searchParams.set('order', 'published_at.desc'); articlesUrl.searchParams.set('limit', '1000'); articlesUrl.searchParams.set('offset', String(offset))
      const articleResult = await fetch(articlesUrl, { headers }).catch(() => null)
      if (!articleResult?.ok) break
      const batch = await articleResult.json().catch(() => [])
      articles.push(...batch)
      if (batch.length < 1000) break
    }
  }
  const entries = [
    ...staticPaths.map((path) => ({ loc: new URL(path, base).toString() })),
    ...categories.map((row) => ({ loc: new URL(`/categorias/${encodeURIComponent(row.slug)}`, base).toString(), lastmod: row.updated_at })),
    ...articles.map((row) => ({ loc: new URL(`/noticias/${encodeURIComponent(row.slug)}`, base).toString(), lastmod: row.updated_at || row.published_at })),
  ]
  const body = entries.map((entry) => `<url><loc>${xml(entry.loc)}</loc>${entry.lastmod ? `<lastmod>${xml(new Date(entry.lastmod).toISOString())}</lastmod>` : ''}</url>`).join('')
  response.setHeader('Content-Type', 'application/xml; charset=utf-8'); response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  response.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`)
}
