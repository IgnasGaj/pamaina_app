import type { BusinessType, VacationPolicyType, WorkWeekType } from '@/types/company.types'

export const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string; description: string }[] = [
  { value: 'FACTORY', label: 'Factory', description: 'Manufacturing and production sites' },
  { value: 'RESTAURANT', label: 'Restaurant', description: 'Cafes, restaurants, and food service' },
  { value: 'RETAIL', label: 'Retail', description: 'Shops and storefronts' },
  { value: 'WAREHOUSE', label: 'Warehouse', description: 'Storage and fulfillment centers' },
  { value: 'LOGISTICS', label: 'Logistics', description: 'Transport and delivery operations' },
  { value: 'OFFICE', label: 'Office', description: 'Corporate and administrative teams' },
  { value: 'OTHER', label: 'Other', description: "Doesn't fit the categories above" },
]

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = Object.fromEntries(
  BUSINESS_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<BusinessType, string>

export const WORK_WEEK_TYPE_OPTIONS: { value: WorkWeekType; label: string; description: string }[] = [
  { value: 'FIVE_DAY', label: '5-day work week', description: 'Standard Monday–Friday schedule' },
  { value: 'SIX_DAY', label: '6-day work week', description: 'Six working days per week' },
  {
    value: 'SUMMARIZED',
    label: 'Summarized working time',
    description: 'Aggregated hours over a longer accounting period, common for shift work',
  },
]

export const WORK_WEEK_TYPE_LABELS: Record<WorkWeekType, string> = Object.fromEntries(
  WORK_WEEK_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<WorkWeekType, string>

export const VACATION_POLICY_OPTIONS: { value: VacationPolicyType; label: string; description: string }[] = [
  { value: 'ANNUAL_ALLOCATION', label: 'Annual allocation', description: 'Employees receive their full leave balance at the start of each year' },
  { value: 'MONTHLY_ACCRUAL', label: 'Monthly accrual', description: 'Leave balance accrues gradually, month by month' },
]

export const VACATION_POLICY_LABELS: Record<VacationPolicyType, string> = Object.fromEntries(
  VACATION_POLICY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<VacationPolicyType, string>

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
