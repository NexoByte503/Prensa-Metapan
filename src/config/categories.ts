import type { Category, CategorySlug } from '@/types'

// These slugs match the idempotent category seed in Supabase.
export const categories = [
  { slug: 'metapan', name: 'Metapán', description: 'Gobierno local, comunidad, servicios y vida cotidiana en Metapán.' },
  { slug: 'santa-ana', name: 'Santa Ana', description: 'El acontecer del departamento de Santa Ana y sus municipios.' },
  { slug: 'nacionales', name: 'Nacionales', description: 'Política, economía y sociedad de El Salvador.' },
  { slug: 'internacionales', name: 'Internacionales', description: 'Acontecimientos del mundo con impacto en El Salvador.' },
  { slug: 'deportes', name: 'Deportes', description: 'Deporte local, departamental y nacional.' },
  { slug: 'entretenimiento', name: 'Entretenimiento', description: 'Cine, música, espectáculos y vida cultural.' },
  { slug: 'economia', name: 'Economía', description: 'Empresas, empleo, precios y finanzas.' },
  { slug: 'tecnologia', name: 'Tecnología', description: 'Innovación, Internet y servicios digitales.' },
] as const satisfies readonly Category[]

const categoriesBySlug = new Map<string, Category>(categories.map((category) => [category.slug, category]))
export function getCategoryBySlug(slug: string): Category | undefined { return categoriesBySlug.get(slug) }
export function isCategorySlug(value: string): value is CategorySlug { return categoriesBySlug.has(value) }
