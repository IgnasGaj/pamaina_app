export interface Role {
  id: string
  companyId: string | null
  name: string
  key: string
  description: string | null
  isSystem: boolean
  permissions: string[]
}
