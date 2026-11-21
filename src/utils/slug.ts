const SLUG_STRIP_PATTERN = /[^a-z0-9\s-]/g

/**
 * Genera un slug SEO amigable a partir de un título en español.
 * Ejemplo: "Gobierno de Metapán anuncia ..." -> "gobierno-de-metapan-anuncia"
 */
export function slugify(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  const slug = normalized
    .replace(SLUG_STRIP_PATTERN, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug.slice(0, 120)
}
