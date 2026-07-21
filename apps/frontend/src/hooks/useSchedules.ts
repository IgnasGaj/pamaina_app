import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import {
  copyPreviousMonth,
  createAssignment,
  createSchedule,
  deleteAssignment,
  getSchedule,
  listAbsences,
  listSchedules,
  publishSchedule,
  updateAssignment,
  updateSchedule,
} from '@/api/schedules.api'
import type {
  CreateAssignmentPayload,
  CreateSchedulePayload,
  ListAbsencesQuery,
  ListSchedulesQuery,
  Schedule,
  ScheduleAssignment,
  UpdateAssignmentPayload,
  UpdateSchedulePayload,
} from '@/types/schedule.types'

export const scheduleKeys = {
  all: ['schedules'] as const,
  lists: () => [...scheduleKeys.all, 'list'] as const,
  list: (query: ListSchedulesQuery) => [...scheduleKeys.lists(), query] as const,
  details: () => [...scheduleKeys.all, 'detail'] as const,
  detail: (id: string) => [...scheduleKeys.details(), id] as const,
  absences: (query: ListAbsencesQuery) => [...scheduleKeys.all, 'absences', query] as const,
}

export function useAbsences(query: ListAbsencesQuery, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: scheduleKeys.absences(query),
    queryFn: () => listAbsences(query),
    enabled: options.enabled,
  })
}

export function useSchedules(query: ListSchedulesQuery = {}) {
  return useQuery({
    queryKey: scheduleKeys.list(query),
    queryFn: () => listSchedules(query),
  })
}

export function useSchedule(id: string | undefined) {
  return useQuery({
    queryKey: scheduleKeys.detail(id ?? ''),
    queryFn: () => getSchedule(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSchedulePayload) => createSchedule(payload),
    onSuccess: (schedule) => {
      queryClient.setQueryData(scheduleKeys.detail(schedule.id), schedule)
      void queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() })
    },
  })
}

export function useUpdateSchedule(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateSchedulePayload) => updateSchedule(id, payload),
    onSuccess: (schedule) => {
      queryClient.setQueryData(scheduleKeys.detail(id), schedule)
      void queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() })
    },
  })
}

export function usePublishSchedule(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => publishSchedule(id),
    onSuccess: (schedule) => {
      queryClient.setQueryData(scheduleKeys.detail(id), schedule)
      void queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() })
    },
  })
}

export function useCopyPreviousMonth(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => copyPreviousMonth(id),
    onSuccess: (schedule) => {
      queryClient.setQueryData(scheduleKeys.detail(id), schedule)
    },
  })
}

/**
 * Assignment mutations patch the cached schedule directly instead of
 * invalidating it. With up to ~300 employees x 31 days, refetching the
 * whole month on every single cell click would be wasteful and would
 * replace every assignment's object reference, defeating ScheduleCell's
 * memoization — patching preserves referential identity for every
 * *unaffected* assignment so unrelated cells don't re-render.
 */
function patchAssignmentInCache(queryClient: QueryClient, scheduleId: string, assignment: ScheduleAssignment): void {
  queryClient.setQueryData<Schedule>(scheduleKeys.detail(scheduleId), (old) => {
    if (!old) return old
    const exists = old.assignments.some((a) => a.id === assignment.id)
    const assignments = exists
      ? old.assignments.map((a) => (a.id === assignment.id ? assignment : a))
      : [...old.assignments, assignment]
    return { ...old, assignments }
  })
}

function removeAssignmentFromCache(queryClient: QueryClient, scheduleId: string, assignmentId: string): void {
  queryClient.setQueryData<Schedule>(scheduleKeys.detail(scheduleId), (old) => {
    if (!old) return old
    return { ...old, assignments: old.assignments.filter((a) => a.id !== assignmentId) }
  })
}

export function useCreateAssignment(scheduleId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAssignmentPayload) => createAssignment(payload),
    onSuccess: (assignment) => {
      patchAssignmentInCache(queryClient, scheduleId, assignment)
    },
  })
}

export function useUpdateAssignment(scheduleId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAssignmentPayload }) => updateAssignment(id, payload),
    onSuccess: (assignment) => {
      patchAssignmentInCache(queryClient, scheduleId, assignment)
    },
  })
}

export function useDeleteAssignment(scheduleId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAssignment(id),
    onSuccess: (_data, id) => {
      removeAssignmentFromCache(queryClient, scheduleId, id)
    },
  })
}
