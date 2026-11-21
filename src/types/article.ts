export const categorySlugs = [
  'metapan',
  'santa-ana',
  'nacionales',
  'internacionales',
  'deportes',
  'entretenimiento',
  'economia',
  'tecnologia',
] as const

export type CategorySlug = (typeof categorySlugs)[number]

export interface Category {
  readonly slug: CategorySlug
  readonly name: string
  readonly description: string
}

export type ArticleStatus = 'draft' | 'review' | 'published' | 'archived'

export interface Author {
  readonly id: string
  readonly name: string
  readonly slug?: string
  readonly avatarUrl?: string
  readonly bio?: string
}

export interface ArticleSummary {
  readonly id: string
  readonly slug: string
  readonly title: string
  readonly excerpt: string
  readonly categorySlug: CategorySlug
  readonly coverImageUrl?: string
  readonly coverImageAlt?: string
  readonly publishedAt: string
  readonly updatedAt?: string
  readonly author: Author
  readonly readingTimeMinutes?: number
}

export interface Article extends ArticleSummary {
  readonly status: ArticleStatus
  readonly content: string
  readonly tags?: readonly string[]
}
