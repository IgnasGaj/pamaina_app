/**
 * Locale-aware calendar formatting. Adding a future country/locale means
 * adding one more branch to each lookup below — no caller ever needs to
 * change, which is what keeps the calendar engine reusable beyond Lithuania.
 */
export type AppLocale = 'lt' | 'en'

const MONTH_NAMES: Record<AppLocale, string[]> = {
  lt: ['Sausis', 'Vasaris', 'Kovas', 'Balandis', 'Gegužė', 'Birželis', 'Liepa', 'Rugpjūtis', 'Rugsėjis', 'Spalis', 'Lapkritis', 'Gruodis'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

/** Genitive case, required by Lithuanian date grammar (e.g. "liepos 15 d."). */
const MONTH_NAMES_GENITIVE_LT = [
  'sausio', 'vasario', 'kovo', 'balandžio', 'gegužės', 'birželio', 'liepos', 'rugpjūčio', 'rugsėjo', 'spalio', 'lapkričio', 'gruodžio',
]

/** Monday-first, matching the Lithuanian work week convention used throughout the app's calendars. */
const WEEKDAY_SHORT: Record<AppLocale, string[]> = {
  lt: ['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
}

export function getMonthNames(locale: AppLocale): string[] {
  return MONTH_NAMES[locale]
}

/** Monday-first weekday abbreviations, e.g. index 0 = Monday. */
export function getWeekdayShortLabels(locale: AppLocale): string[] {
  return WEEKDAY_SHORT[locale]
}

/** 1 (Monday) .. 7 (Sunday) for a "YYYY-MM-DD" key, parsed as a plain calendar date (no timezone shift). */
export function isoWeekday(dateKeyValue: string): number {
  const [year, month, day] = dateKeyValue.split('-').map(Number)
  const jsDay = new Date(year, month - 1, day).getDay()
  return jsDay === 0 ? 7 : jsDay
}

export function isWeekendDate(dateKeyValue: string): boolean {
  return isoWeekday(dateKeyValue) >= 6
}

function todayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function isTodayDate(dateKeyValue: string): boolean {
  return dateKeyValue === todayKey()
}

/** "2026-07-15" -> "2026 m. liepos 15 d." (or the English equivalent for the 'en' locale). */
export function formatLongDate(dateKeyValue: string, locale: AppLocale): string {
  const [year, month, day] = dateKeyValue.split('-').map(Number)
  if (locale === 'lt') {
    return `${year} m. ${MONTH_NAMES_GENITIVE_LT[month - 1]} ${day} d.`
  }
  return `${MONTH_NAMES.en[month - 1]} ${day}, ${year}`
}

/** Same as formatLongDate but also appends a 24-hour "HH:mm" time, for full ISO timestamps. */
export function formatLongDateTime(isoValue: string, locale: AppLocale): string {
  const date = new Date(isoValue)
  const dateKeyValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${formatLongDate(dateKeyValue, locale)} ${time}`
}
