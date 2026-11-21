import { categories } from './categories'
import { paths } from '@/routes/paths'

export interface NavigationItem {
  readonly label: string
  readonly to: string
}

export const primaryNavigation: readonly NavigationItem[] = [
  { label: 'Inicio', to: paths.home },
  ...categories.map((category) => ({
    label: category.name,
    to: paths.category(category.slug),
  })),
]

export const institutionalNavigation: readonly NavigationItem[] = [
  { label: 'Quiénes somos', to: paths.about },
  { label: 'Contacto', to: paths.contact },
  { label: 'Política editorial', to: paths.editorialPolicy },
]

export const legalNavigation: readonly NavigationItem[] = [
  { label: 'Privacidad', to: paths.privacy },
  { label: 'Términos de uso', to: paths.terms },
]
