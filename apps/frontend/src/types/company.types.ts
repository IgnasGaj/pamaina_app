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
}
