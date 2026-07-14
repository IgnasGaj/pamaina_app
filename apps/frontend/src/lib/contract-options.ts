import type { ContractStatus, ContractType, WorkWeek } from '@/types/contract.types'

export const CONTRACT_TYPE_OPTIONS: { value: ContractType; label: string }[] = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'FIXED_TERM', label: 'Fixed term' },
  { value: 'SEASONAL', label: 'Seasonal' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'INTERNSHIP', label: 'Internship' },
]

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = Object.fromEntries(
  CONTRACT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ContractType, string>

export const CONTRACT_STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'ENDED', label: 'Ended' },
]

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = Object.fromEntries(
  CONTRACT_STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ContractStatus, string>

export const CONTRACT_STATUS_BADGE_VARIANT: Record<ContractStatus, 'success' | 'warning' | 'secondary' | 'outline'> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  DRAFT: 'outline',
  ENDED: 'secondary',
}

export const WORK_WEEK_OPTIONS: { value: WorkWeek; label: string }[] = [
  { value: 'FIVE_DAY', label: '5-day week' },
  { value: 'SIX_DAY', label: '6-day week' },
  { value: 'CUSTOM', label: 'Custom' },
]

export const WORK_WEEK_LABELS: Record<WorkWeek, string> = Object.fromEntries(
  WORK_WEEK_OPTIONS.map((option) => [option.value, option.label]),
) as Record<WorkWeek, string>
