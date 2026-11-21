import { env } from './env'

/**
 * Global identity of the publication.
 *
 * The palette and visual identity are provisional until the official
 * logo and brand guide are provided.
 */
export const siteConfig = {
  name: 'Prensa Metapán',
  shortName: 'Prensa Metapán',
  tagline: 'Periodismo local, mirada nacional.',
  description:
    'Portal de noticias de Metapán, Santa Ana y El Salvador. Información local con contexto, verificación y servicio público.',
  locale: 'es-SV',
  language: 'es',
  timeZone: 'America/El_Salvador',
  location: 'Metapán, Santa Ana, El Salvador',
  url: env.siteUrl,
  isIndexable: env.siteIndexable,
  launchStatus: 'Fase 1 · Base técnica en preparación',
} as const
