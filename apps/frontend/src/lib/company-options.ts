import { useTranslation } from 'react-i18next'

import type { BusinessType, VacationPolicyType, WorkWeekType } from '@/types/company.types'

const BUSINESS_TYPE_VALUES: BusinessType[] = ['FACTORY', 'RESTAURANT', 'RETAIL', 'WAREHOUSE', 'LOGISTICS', 'OFFICE', 'OTHER']
const WORK_WEEK_TYPE_VALUES: WorkWeekType[] = ['FIVE_DAY', 'SIX_DAY', 'SUMMARIZED']
const VACATION_POLICY_TYPE_VALUES: VacationPolicyType[] = ['ANNUAL_ALLOCATION', 'MONTHLY_ACCRUAL']

/** Translated option lists for the onboarding wizard's option cards. */
export function useBusinessTypeOptions(): { value: BusinessType; label: string; description: string }[] {
  const { t } = useTranslation()
  return BUSINESS_TYPE_VALUES.map((value) => ({
    value,
    label: t(`companyOptions.businessType.${value}`),
    description: t(`companyOptions.businessType.${value}_DESC`),
  }))
}

export function useWorkWeekTypeOptions(): { value: WorkWeekType; label: string; description: string }[] {
  const { t } = useTranslation()
  return WORK_WEEK_TYPE_VALUES.map((value) => ({
    value,
    label: t(`companyOptions.workWeekType.${value}`),
    description: t(`companyOptions.workWeekType.${value}_DESC`),
  }))
}

export function useVacationPolicyOptions(): { value: VacationPolicyType; label: string; description: string }[] {
  const { t } = useTranslation()
  return VACATION_POLICY_TYPE_VALUES.map((value) => ({
    value,
    label: t(`companyOptions.vacationPolicy.${value}`),
    description: t(`companyOptions.vacationPolicy.${value}_DESC`),
  }))
}

/** For rendering a single stored value (e.g. the Dashboard badge, the onboarding summary). */
export function useBusinessTypeLabel(value: BusinessType | null | undefined): string | null {
  const { t } = useTranslation()
  return value ? t(`companyOptions.businessType.${value}`) : null
}

export function useWorkWeekTypeLabel(value: WorkWeekType | null | undefined): string | null {
  const { t } = useTranslation()
  return value ? t(`companyOptions.workWeekType.${value}`) : null
}

export function useVacationPolicyLabel(value: VacationPolicyType | null | undefined): string | null {
  const { t } = useTranslation()
  return value ? t(`companyOptions.vacationPolicy.${value}`) : null
}

export const COUNTRY_OPTIONS: { value: string; label: string }[] = [
  { value: 'LT', label: 'Lithuania' },
  { value: 'LV', label: 'Latvia' },
  { value: 'EE', label: 'Estonia' },
  { value: 'PL', label: 'Poland' },
  { value: 'DE', label: 'Germany' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'IE', label: 'Ireland' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'FI', label: 'Finland' },
  { value: 'US', label: 'United States' },
  { value: 'OTHER', label: 'Other' },
]

export const TIMEZONE_OPTIONS: string[] = [
  'Europe/Vilnius',
  'Europe/Riga',
  'Europe/Tallinn',
  'Europe/Warsaw',
  'Europe/Berlin',
  'Europe/London',
  'Europe/Dublin',
  'Europe/Stockholm',
  'Europe/Oslo',
  'Europe/Helsinki',
  'America/New_York',
  'UTC',
]

export const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'lt', label: 'Lietuvių' },
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'pl', label: 'Polski' },
]
