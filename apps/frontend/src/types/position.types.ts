export interface Position {
  id: string
  companyId: string
  departmentId: string | null
  departmentName: string | null
  title: string
  description: string | null
  isActive: boolean
  employeeCount: number
  createdAt: string
}

export interface CreatePositionPayload {
  title: string
  description?: string
  departmentId?: string
}

export interface UpdatePositionPayload {
  title?: string
  description?: string
  departmentId?: string | null
  isActive?: boolean
}

export interface ListPositionsQuery {
  page?: number
  pageSize?: number
  search?: string
  departmentId?: string
}
