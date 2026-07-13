export interface Company {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  country: string
  timezone: string
  legalCode: string | null
  vatCode: string | null
  isActive: boolean
  createdAt: string
}

export interface UpdateCompanyPayload {
  name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  legalCode?: string
  vatCode?: string
  isActive?: boolean
  country?: string
  timezone?: string
}

export const BUSINESS_TYPES = [
  'FACTORY',
  'RESTAURANT',
  'RETAIL',
  'WAREHOUSE',
  'LOGISTICS',
  'OFFICE',
  'OTHER',
] as const
export type BusinessType = (typeof BUSINESS_TYPES)[number]

export const WORK_WEEK_TYPES = ['FIVE_DAY', 'SIX_DAY', 'SUMMARIZED'] as const
export type WorkWeekType = (typeof WORK_WEEK_TYPES)[number]

export const VACATION_POLICY_TYPES = ['ANNUAL_ALLOCATION', 'MONTHLY_ACCRUAL'] as const
export type VacationPolicyType = (typeof VACATION_POLICY_TYPES)[number]

export interface CompanySettings {
  id: string
  companyId: string
  logoUrl: string | null
  preferredLanguage: string
  businessType: BusinessType | null
  workWeekType: WorkWeekType | null
  vacationPolicy: VacationPolicyType | null
  onboardingCompletedAt: string | null
}

export interface UpdateCompanySettingsPayload {
  logoUrl?: string
  preferredLanguage?: string
  businessType?: BusinessType
  workWeekType?: WorkWeekType
  vacationPolicy?: VacationPolicyType
}
