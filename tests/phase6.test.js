import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { escapeHtml, plainParagraphs, safeHttpUrl } from '../api/article.js'
import robotsHandler from '../api/robots.js'

const invokeRobots = (indexable) => {
  process.env.VITE_SITE_URL = 'https://prensametapan.example'
  process.env.VITE_SITE_INDEXABLE = indexable
  const response = {
    headers: {},
    setHeader(name, value) { this.headers[name] = value },
    status(code) { this.code = code; return this },
    send(body) { this.body = body; return this },
  }
  robotsHandler({ headers: { host: 'localhost:5173' } }, response)
  return response
}

test('escapes HTML metadata and article text', () => {
  assert.equal(escapeHtml(`<script x='y'>&`), '&lt;script x=&#39;y&#39;&gt;&amp;')
  assert.equal(plainParagraphs('<p>Hola <strong>Mundo</strong></p><script>alert(1)</script>'), '<p>Hola Mundo</p>')
  assert.equal(plainParagraphs('<img src=x onerror=alert(1)>Texto'), '<p>Texto</p>')
})

test('only accepts HTTP and HTTPS image URLs', () => {
  assert.equal(safeHttpUrl('javascript:alert(1)'), '')
  assert.equal(safeHttpUrl('data:image/svg+xml,<svg/>'), '')
  assert.equal(safeHttpUrl('https://cdn.example/image.jpg'), 'https://cdn.example/image.jpg')
})

test('robots blocks all indexing until explicitly enabled', () => {
  const response = invokeRobots('false')
  assert.equal(response.code, 200)
  assert.match(response.body, /Disallow: \/\n/)
  assert.match(response.body, /Sitemap: https:\/\/prensametapan\.example\/sitemap\.xml/)
})

test('robots allows public pages and excludes admin/search when enabled', () => {
  const response = invokeRobots('true')
  assert.match(response.body, /Allow: \/\n/)
  assert.match(response.body, /Disallow: \/admin/)
  assert.match(response.body, /Disallow: \/buscar/)
  assert.doesNotMatch(response.body, /Disallow: \/\n/)
})

test('Vercel routes dynamic SEO endpoints before SPA fallback and applies security headers', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
  assert.deepEqual(config.rewrites.slice(0, 3).map(({ source }) => source), ['/sitemap.xml', '/robots.txt', '/noticias/:slug'])
  assert.equal(config.rewrites.at(-1).destination, '/index.html')
  const headers = config.headers[0].headers
  assert.ok(headers.some(({ key }) => key === 'Content-Security-Policy'))
  assert.ok(headers.some(({ key, value }) => key === 'X-Content-Type-Options' && value === 'nosniff'))
  assert.ok(headers.some(({ key }) => key === 'Strict-Transport-Security'))
})
