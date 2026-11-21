import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { siteConfig } from '@/config/site'

interface SeoProps {
  title?: string
  description?: string
  path?: string
  type?: 'website' | 'article'
  noIndex?: boolean
  image?: string | null
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.content = content
}

function removeMeta(attribute: 'name' | 'property', key: string): void {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove()
}

function upsertCanonical(href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }

  element.href = href
}

function removeCanonical(): void {
  document.head.querySelector('link[rel="canonical"]')?.remove()
}

/**
 * Client-side document metadata for SPA routes; article metadata is also
 * rendered by the server-side Vercel endpoint for sharing and indexing.
 */
export function Seo({
  title,
  description = siteConfig.description,
  path = '/',
  type = 'website',
  noIndex = false,
  image,
}: SeoProps) {
  useEffect(() => {
    const fullTitle = title
      ? `${title} | ${siteConfig.name}`
      : `${siteConfig.name} · ${siteConfig.tagline}`

    const canonicalUrl = new URL(path, siteConfig.url ?? window.location.origin).toString()
    const isIndexable = siteConfig.isIndexable && !noIndex

    document.title = fullTitle

    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', isIndexable ? 'index, follow' : 'noindex, nofollow')
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('property', 'og:site_name', siteConfig.name)
    upsertMeta('property', 'og:locale', siteConfig.locale.replace('-', '_'))
    try {
      if (!image) throw new Error('No social image')
      const imageUrl = new URL(image, canonicalUrl).toString()
      if (!['http:', 'https:'].includes(new URL(imageUrl).protocol)) throw new Error('Unsafe social image')
      upsertMeta('property', 'og:image', imageUrl)
      upsertMeta('name', 'twitter:image', imageUrl)
    } catch { removeMeta('property', 'og:image'); removeMeta('name', 'twitter:image') }
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', description)

    if (isIndexable) {
      upsertCanonical(canonicalUrl)
    } else {
      removeCanonical()
    }
  }, [description, image, noIndex, path, title, type])

  return null
}

export function StructuredData({ data }: { readonly data: Record<string, unknown> }): ReactNode {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}

export function BreadcrumbStructuredData({ items }: { readonly items: readonly { name: string; url: string }[] }): ReactNode {
  if (items.length < 2) return null
  return <StructuredData data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })) }} />
}
