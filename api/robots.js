export default function handler(request, response) {
  const base = process.env.VITE_SITE_URL ? new URL(process.env.VITE_SITE_URL).origin : `https://${request.headers['x-forwarded-host'] || request.headers.host}`
  const body = process.env.VITE_SITE_INDEXABLE === 'true'
    ? `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin/\nDisallow: /buscar\nSitemap: ${base}/sitemap.xml\n`
    : `User-agent: *\nDisallow: /\nSitemap: ${base}/sitemap.xml\n`
  response.setHeader('Content-Type', 'text/plain; charset=utf-8'); response.setHeader('Cache-Control', 'public, s-maxage=300')
  response.status(200).send(body)
}
