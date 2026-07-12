export interface Department {
  id: string
  companyId: string
  name: string
  description: string | null
  isActive: boolean
  employeeCount: number
  createdAt: string
}

export interface CreateDepartmentPayload {
  name: string
  description?: string
}

export interface UpdateDepartmentPayload {
  name?: string
  description?: string
  isActive?: boolean
}

export interface ListDepartmentsQuery {
  page?: number
  pageSize?: number
  search?: string
}
