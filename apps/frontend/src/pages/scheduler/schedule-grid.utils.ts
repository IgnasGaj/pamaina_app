function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/** Formats a calendar day as the YYYY-MM-DD key used both for API dates and cell lookups. */
export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function cellKey(employeeId: string, date: string): string {
  return `${employeeId}|${date}`
}
