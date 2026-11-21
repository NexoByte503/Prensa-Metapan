/**
 * Sanitiza el HTML enriquecido generado por el editor antes de persistirlo
 * o renderizarlo en el portal público. Solo se permite una lista blanca de
 * etiquetas y atributos seguros; solo se conservan embeds de video permitidos.
 */

const BLOCKED_TAGS = new Set([
  'script',
  'style',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'option',
  'link',
  'meta',
  'base',
  'svg',
  'math',
  'template',
  'noscript',
  'picture',
])

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'blockquote',
  'pre',
  'code',
  'ul',
  'ol',
  'li',
  'section',
  'figure',
  'figcaption',
  'img',
  'a',
  'strong',
  'em',
  'b',
  'i',
  's',
  'u',
  'span',
  'iframe',
])

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  '*': ['title'],
  a: ['href', 'title'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  iframe: ['src', 'title', 'allow', 'allowfullscreen'],
}

function isSafeUrl(value: string, kind: 'href' | 'src'): boolean {
  const candidate = value.trim().toLowerCase()

  if (candidate.startsWith('javascript:') || candidate.startsWith('data:text/html')) {
    return false
  }

  if (kind === 'src') {
    if (candidate.startsWith('data:image/')) {
      return true
    }
  }

  try {
    const url = new URL(candidate)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function sanitizeNode(node: Element): void {
  const tagName = node.tagName.toLowerCase()

  if (BLOCKED_TAGS.has(tagName)) {
    node.remove()
    return
  }

  if (!ALLOWED_TAGS.has(tagName)) {
    node.remove()
    return
  }

  if (tagName === 'iframe') {
    let host = ''
    try { host = new URL(node.getAttribute('src') ?? '').hostname } catch { node.remove(); return }
    if (!['www.youtube-nocookie.com', 'www.youtube.com', 'player.vimeo.com'].includes(host)) {
      node.remove()
      return
    }
  }

  const allowedAttributes = (ALLOWED_ATTRIBUTES['*'] ?? []).concat(ALLOWED_ATTRIBUTES[tagName] ?? [])

  for (const attribute of Array.from(node.attributes)) {
    const attributeName = attribute.name.toLowerCase()

    if (!allowedAttributes.includes(attributeName)) {
      node.removeAttribute(attribute.name)
      continue
    }

    const value = node.getAttribute(attribute.name)

    if (value === null) {
      node.removeAttribute(attribute.name)
      continue
    }

    const isUrlAttribute = (tagName === 'a' && attributeName === 'href') || ((tagName === 'img' || tagName === 'iframe') && attributeName === 'src')
    const isSafe = !isUrlAttribute || isSafeUrl(value, tagName === 'a' ? 'href' : 'src')

    if (!isSafe) {
      node.removeAttribute(attribute.name)
    }
  }

  Array.from(node.childNodes).forEach((child) => {
    if (child instanceof Element) {
      sanitizeNode(child)
    }
  })
}

/**
 * Devuelve un fragmento HTML seguro, sin scripts, frames ni atributos
 * peligrosos, listo para almacenarse en PostgreSQL o inyectarse en el portal.
 */
export function sanitizeHtml(html: string): string {
  if (!html) {
    return ''
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const body = doc.body

  Array.from(body.childNodes).forEach((child) => {
    if (child instanceof Element) {
      sanitizeNode(child)
    }
  })

  return body.innerHTML.trim()
}
