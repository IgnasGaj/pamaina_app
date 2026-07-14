import type { ShiftTemplate } from '@/types/shift-template.types'

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/** Shift duration in hours minus its break. Overnight shifts (e.g. 22:00-06:00) wrap past midnight. */
export function calculateShiftDurationHours(
  template: Pick<ShiftTemplate, 'startTime' | 'endTime' | 'breakMinutes'>,
): number {
  const start = timeToMinutes(template.startTime)
  const end = timeToMinutes(template.endTime)
  const spanMinutes = end > start ? end - start : 24 * 60 - start + end
  const workedMinutes = Math.max(0, spanMinutes - template.breakMinutes)
  return workedMinutes / 60
}

export type MonthlyHoursStatus = 'under' | 'exact' | 'over'

/** Rounds away floating-point noise (e.g. 167.9999999996) before comparing. */
function roundHours(value: number): number {
  return Math.round(value * 100) / 100
}

export function getMonthlyHoursStatus(assigned: number, required: number): MonthlyHoursStatus {
  const diff = roundHours(assigned) - roundHours(required)
  if (diff === 0) return 'exact'
  return diff < 0 ? 'under' : 'over'
}

export const MONTHLY_HOURS_STATUS_COLORS: Record<MonthlyHoursStatus, string> = {
  under: 'text-orange-600',
  exact: 'text-green-600',
  over: 'text-red-600',
}

export function formatHours(value: number): string {
  const rounded = roundHours(value)
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}
