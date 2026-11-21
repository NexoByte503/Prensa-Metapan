import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const publicEnv = loadEnv(mode, process.cwd(), 'VITE_')
  const baseUrl = publicEnv.VITE_SITE_URL?.trim()
  const configuredSocialImage = publicEnv.VITE_SOCIAL_IMAGE?.trim()
  const socialImage = (() => {
    try {
      if (!configuredSocialImage) return ''
      const parsed = new URL(configuredSocialImage)
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : ''
    } catch {
      return ''
    }
  })()
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
          '<meta name="twitter:title" content="Prensa Metapán · Periodismo local y nacional">',
          '<meta name="twitter:description" content="Prensa Metapán: periodismo local de Metapán, Santa Ana y El Salvador, con contexto y verificación.">',
          '<meta property="og:type" content="website">',
          ...(baseUrl ? [`<meta property="og:url" content="${attr(baseUrl.replace(/\/$/, '') + '/')}">`] : []),
          '<meta property="og:site_name" content="Prensa Metapán">',
          '<meta property="og:locale" content="es_SV">',
          ...(socialImage ? [`<meta property="og:image" content="${attr(socialImage)}">`] : []),
          `<meta name="twitter:card" content="${socialImage ? 'summary_large_image' : 'summary'}">`,
          ...(socialImage ? [`<meta name="twitter:image" content="${attr(socialImage)}">`] : []),
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
