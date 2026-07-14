import type { ShiftType } from '@/types/schedule.types'

export const SHIFT_TYPE_OPTIONS: { value: ShiftType; label: string; code: string }[] = [
  { value: 'MORNING', label: 'Morning', code: 'M' },
  { value: 'AFTERNOON', label: 'Afternoon', code: 'A' },
  { value: 'NIGHT', label: 'Night', code: 'N' },
  { value: 'DAY', label: 'Day', code: 'D' },
  { value: 'OFF', label: 'Off', code: 'O' },
  { value: 'VACATION', label: 'Vacation', code: 'V' },
  { value: 'SICK', label: 'Sick', code: 'S' },
]

export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = Object.fromEntries(
  SHIFT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ShiftType, string>

export const SHIFT_TYPE_CODES: Record<ShiftType, string> = Object.fromEntries(
  SHIFT_TYPE_OPTIONS.map((option) => [option.value, option.code]),
) as Record<ShiftType, string>

/** Cell background/text color per shift type, matching the brief's mandated palette. */
export const SHIFT_TYPE_COLORS: Record<ShiftType, string> = {
  MORNING: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  AFTERNOON: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  NIGHT: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  DAY: 'bg-green-100 text-green-800 hover:bg-green-200',
  OFF: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  VACATION: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  SICK: 'bg-red-100 text-red-800 hover:bg-red-200',
}
