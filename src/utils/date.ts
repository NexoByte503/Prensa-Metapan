import { siteConfig } from '@/config/site'

const longDateFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: siteConfig.timeZone,
})

const shortDateFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: siteConfig.timeZone,
})

function parseDate(value: Date | string): Date | null {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function capitalize(value: string): string {
  return value.length > 0 ? value.charAt(0).toLocaleUpperCase(siteConfig.locale) + value.slice(1) : value
}

/** Example: "Miércoles, 18 de noviembre de 2026". */
export function formatLongDate(value: Date | string): string {
  const date = parseDate(value)
  return date ? capitalize(longDateFormatter.format(date)) : ''
}

/** Example: "18 nov 2026". */
export function formatShortDate(value: Date | string): string {
  const date = parseDate(value)
  return date ? shortDateFormatter.format(date).replace('.', '') : ''
}

/**
 * Formats a date for an `<input type="datetime-local">` using the editor's
 * local time. `toISOString().slice(0, 16)` must not be used here because the
 * browser would reinterpret the UTC string as local time and shift it.
 */
export function toDateTimeLocalValue(value: Date | string): string {
  const date = parseDate(value)
  if (!date) {
    return ''
  }

  const pad = (part: number): string => String(part).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function getCurrentYear(): number {
  return new Date().getFullYear()
}
