import { apiClient, unwrap, unwrapPaginated } from '@/lib/api-client'
import type { PaginatedResult } from '@/types/api.types'
import type {
  CreateShiftTemplatePayload,
  ListShiftTemplatesQuery,
  ShiftTemplate,
  UpdateShiftTemplatePayload,
} from '@/types/shift-template.types'

export function listShiftTemplates(query: ListShiftTemplatesQuery = {}): Promise<PaginatedResult<ShiftTemplate>> {
  return unwrapPaginated(apiClient.get('/shift-templates', { params: query }))
}

export function getShiftTemplate(id: string): Promise<ShiftTemplate> {
  return unwrap(apiClient.get(`/shift-templates/${id}`))
}

export function createShiftTemplate(payload: CreateShiftTemplatePayload): Promise<ShiftTemplate> {
  return unwrap(apiClient.post('/shift-templates', payload))
}

export function updateShiftTemplate(id: string, payload: UpdateShiftTemplatePayload): Promise<ShiftTemplate> {
  return unwrap(apiClient.patch(`/shift-templates/${id}`, payload))
}

export function archiveShiftTemplate(id: string): Promise<ShiftTemplate> {
  return unwrap(apiClient.post(`/shift-templates/${id}/archive`))
}

export function restoreShiftTemplate(id: string): Promise<ShiftTemplate> {
  return unwrap(apiClient.post(`/shift-templates/${id}/restore`))
}
