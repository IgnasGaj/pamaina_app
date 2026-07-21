import { apiClient, unwrap, unwrapPaginated } from '@/lib/api-client'
import type { PaginatedResult } from '@/types/api.types'
import type {
  AbsenceEntry,
  CreateAssignmentPayload,
  CreateSchedulePayload,
  ListAbsencesQuery,
  ListSchedulesQuery,
  Schedule,
  ScheduleAssignment,
  ScheduleSummary,
  UpdateAssignmentPayload,
  UpdateSchedulePayload,
} from '@/types/schedule.types'

export function listAbsences(query: ListAbsencesQuery): Promise<AbsenceEntry[]> {
  return unwrap(apiClient.get('/schedules/absences', { params: query }))
}

export function listSchedules(query: ListSchedulesQuery = {}): Promise<PaginatedResult<ScheduleSummary>> {
  return unwrapPaginated(apiClient.get('/schedules', { params: query }))
}

export function getSchedule(id: string): Promise<Schedule> {
  return unwrap(apiClient.get(`/schedules/${id}`))
}

export function createSchedule(payload: CreateSchedulePayload): Promise<Schedule> {
  return unwrap(apiClient.post('/schedules', payload))
}

export function updateSchedule(id: string, payload: UpdateSchedulePayload): Promise<Schedule> {
  return unwrap(apiClient.patch(`/schedules/${id}`, payload))
}

export function publishSchedule(id: string): Promise<Schedule> {
  return unwrap(apiClient.post(`/schedules/${id}/publish`))
}

export function copyPreviousMonth(id: string): Promise<Schedule> {
  return unwrap(apiClient.post(`/schedules/${id}/copy-previous`))
}

export function createAssignment(payload: CreateAssignmentPayload): Promise<ScheduleAssignment> {
  return unwrap(apiClient.post('/schedule-assignments', payload))
}

export function updateAssignment(id: string, payload: UpdateAssignmentPayload): Promise<ScheduleAssignment> {
  return unwrap(apiClient.patch(`/schedule-assignments/${id}`, payload))
}

export function deleteAssignment(id: string): Promise<void> {
  return unwrap(apiClient.delete(`/schedule-assignments/${id}`))
}
