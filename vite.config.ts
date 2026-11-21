import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const publicEnv = loadEnv(mode, process.cwd(), 'VITE_')
  const baseUrl = publicEnv.VITE_SITE_URL?.trim()
  const verification = publicEnv.VITE_GOOGLE_SITE_VERIFICATION?.trim()
  const indexable = publicEnv.VITE_SITE_INDEXABLE === 'true'
  const attr = (value: string) => value.replace(/[&"<>]/g, (char) => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' })[char]!)
  return {
    plugins: [react(), tailwindcss(), {
      name: 'prensa-seo-head',
      transformIndexHtml(html: string) {
        const tags = [
          `<meta name="robots" content="${indexable ? 'index,follow' : 'noindex,nofollow'}">`,
          baseUrl ? `<link rel="canonical" href="${attr(baseUrl.replace(/\/$/, '') + '/')}">` : '',
          '<meta property="og:title" content="Prensa Metapán · Periodismo local y nacional">',
          '<meta property="og:description" content="Prensa Metapán: periodismo local de Metapán, Santa Ana y El Salvador, con contexto y verificación.">',
          '<meta property="og:type" content="website">',
          '<meta name="twitter:card" content="summary_large_image">',
          verification ? `<meta name="google-site-verification" content="${attr(verification)}">` : '',
          `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: 'Prensa Metapán', ...(baseUrl ? { url: baseUrl } : {}), areaServed: 'Metapán, Santa Ana, El Salvador' })}</script>`,
          `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Prensa Metapán', ...(baseUrl ? { url: baseUrl } : {}), inLanguage: 'es-SV' })}</script>`,
        ].filter(Boolean).join('\n    ')
        return html.replace('</head>', `    ${tags}\n  </head>`)
      },
    }],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { port: 5173 },
    preview: { port: 4173 },
  }
})
