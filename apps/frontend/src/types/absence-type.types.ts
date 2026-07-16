/**
 * Fixed display order for Pamaina's four standard absence types — API order
 * isn't reliable (all four are created within one registration transaction,
 * so createdAt timestamps can tie), so every list sorts by this instead.
 */
export const ABSENCE_TYPE_CODE_ORDER: readonly string[] = ['P', 'A', 'M', 'L']

/** Pamaina ships exactly four standard Lithuanian absence types — code/name are fixed, custom types aren't supported. */
export interface AbsenceType {
  id: string
  companyId: string
  code: string
  name: string
  color: string
  description: string | null
  isDefault: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

/** Only color/description/active are ever editable — code and name are immutable. */
export interface UpdateAbsenceTypePayload {
  color?: string
  description?: string | null
  active?: boolean
}

export interface ListAbsenceTypesQuery {
  page?: number
  pageSize?: number
}
