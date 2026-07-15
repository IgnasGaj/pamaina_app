import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOwnEmployeeProfile } from '@/hooks/useEmployees'
import { useSchedule, useSchedules } from '@/hooks/useSchedules'
import { useMonthlyHours, useHolidays } from '@/hooks/useWorkingTime'
import { useNotifications } from '@/hooks/useNotifications'
import { useShiftTemplates } from '@/hooks/useShiftTemplates'
import { useAbsenceTypes } from '@/hooks/useAbsenceTypes'
import {
  calculateShiftDurationHours,
  formatHours,
  getMonthlyHoursStatus,
  MONTHLY_HOURS_STATUS_COLORS,
  type MonthlyHoursStatus,
} from '@/lib/monthly-hours'
import { getErrorMessage } from '@/lib/errors'
import type { AbsenceType } from '@/types/absence-type.types'
import type { ScheduleAssignment } from '@/types/schedule.types'
import type { Holiday } from '@/types/working-time.types'
import type { ShiftTemplate } from '@/types/shift-template.types'
import type { NotificationType } from '@/types/notification.types'

const NOTIFICATION_TITLE_KEYS: Record<NotificationType, string> = {
  SCHEDULE_PUBLISHED: 'notifications.schedulePublished',
  REQUEST_SUBMITTED: 'notifications.requestSubmitted',
  REQUEST_APPROVED: 'notifications.vacationApproved',
  REQUEST_REJECTED: 'notifications.vacationRejected',
  SHIFT_ASSIGNED: 'notifications.newShiftAssigned',
  SHIFT_UPDATED: 'notifications.shiftUpdated',
}

const PROGRESS_BAR_COLORS: Record<MonthlyHoursStatus, string> = {
  under: 'bg-orange-500',
  exact: 'bg-green-600',
  over: 'bg-red-600',
}

function greetingKey(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'portal.goodMorning'
  if (hour < 18) return 'portal.goodAfternoon'
  return 'portal.goodEvening'
}

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const zeroBased = month - 1 + delta
  return { year: year + Math.floor(zeroBased / 12), month: ((zeroBased % 12) + 12) % 12 + 1 }
}

export function EmployeeDashboardPage() {
  const { t } = useTranslation()
  const today = new Date()
  const todayKey = today.toISOString().slice(0, 10)
  const tomorrowKey = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const next = addMonths(year, month, 1)

  const profileQuery = useOwnEmployeeProfile()

  const currentMonthQuery = useSchedules({ year, month, pageSize: 1 })
  const currentSummary = currentMonthQuery.data?.items[0]
  const currentScheduleQuery = useSchedule(currentSummary?.id)

  const nextMonthQuery = useSchedules({ year: next.year, month: next.month, pageSize: 1 })
  const nextSummary = nextMonthQuery.data?.items[0]
  const nextScheduleQuery = useSchedule(nextSummary?.id)

  const holidaysQuery = useHolidays({ year, month })
  const nextHolidaysQuery = useHolidays({ year: next.year, month: next.month })

  const hoursQuery = useMonthlyHours(year, month, profileQuery.data?.employmentType ?? 'FULL_TIME')
  const shiftTemplatesQuery = useShiftTemplates({ pageSize: 100 })
  const absenceTypesQuery = useAbsenceTypes({ pageSize: 100 })
  const notificationsQuery = useNotifications({ pageSize: 3 })

  const shiftTemplatesById = useMemo(() => {
    const map = new Map<string, ShiftTemplate>()
    for (const template of shiftTemplatesQuery.data?.items ?? []) map.set(template.id, template)
    return map
  }, [shiftTemplatesQuery.data])

  const absenceTypesById = useMemo(() => {
    const map = new Map<string, AbsenceType>()
    for (const absenceType of absenceTypesQuery.data?.items ?? []) map.set(absenceType.id, absenceType)
    return map
  }, [absenceTypesQuery.data])

  const assignmentsByDate = useMemo(() => {
    const map = new Map<string, ScheduleAssignment>()
    for (const assignment of currentScheduleQuery.data?.assignments ?? []) map.set(assignment.date, assignment)
    for (const assignment of nextScheduleQuery.data?.assignments ?? []) map.set(assignment.date, assignment)
    return map
  }, [currentScheduleQuery.data, nextScheduleQuery.data])

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, Holiday>()
    for (const holiday of holidaysQuery.data ?? []) map.set(holiday.date, holiday)
    for (const holiday of nextHolidaysQuery.data ?? []) map.set(holiday.date, holiday)
    return map
  }, [holidaysQuery.data, nextHolidaysQuery.data])

  const assignedHours = useMemo(() => {
    const currentMonthAssignments = currentScheduleQuery.data?.assignments ?? []
    return currentMonthAssignments.reduce((total, assignment) => {
      if (!assignment.shiftTemplateId) return total
      const template = shiftTemplatesById.get(assignment.shiftTemplateId)
      return template ? total + calculateShiftDurationHours(template) : total
    }, 0)
  }, [currentScheduleQuery.data, shiftTemplatesById])

  const requiredHours = hoursQuery.data?.requiredHours ?? 0
  const hoursStatus = getMonthlyHoursStatus(assignedHours, requiredHours)
  const remaining = requiredHours - assignedHours
  const progressPercent = requiredHours > 0 ? Math.min(100, Math.max(0, (assignedHours / requiredHours) * 100)) : 0

  const isLoading = profileQuery.isLoading || currentMonthQuery.isLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t('portal.loadingDashboard')}
      </div>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="py-16 text-center text-sm text-destructive">
        {profileQuery.error ? getErrorMessage(profileQuery.error) : t('portal.noProfileFound')}
      </div>
    )
  }

  const employee = profileQuery.data

  function renderDayCard(dateKeyValue: string, emptyKey: string) {
    const assignment = assignmentsByDate.get(dateKeyValue)
    const shift = assignment?.shiftTemplateId ? shiftTemplatesById.get(assignment.shiftTemplateId) : undefined
    const absence = assignment?.absenceTypeId ? absenceTypesById.get(assignment.absenceTypeId) : undefined
    const holiday = holidaysByDate.get(dateKeyValue)

    if (shift) {
      return (
        <div className="space-y-1.5">
          <p className="text-2xl font-bold tabular-nums">
            {shift.startTime}–{shift.endTime}
          </p>
          <p className="text-sm font-medium">{shift.name}</p>
          <p className="text-sm text-muted-foreground">{employee.departmentName ?? t('portal.noDepartment')}</p>
          {assignment?.notes && (
            <p className="mt-2 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
              {t('portal.managerNote')}: {assignment.notes}
            </p>
          )}
        </div>
      )
    }

    if (absence) {
      return (
        <div className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: absence.color }} aria-hidden />
          <p className="text-base font-semibold">{absence.name}</p>
        </div>
      )
    }

    return (
      <p className="text-sm text-muted-foreground">
        {holiday ? `${t('scheduler.holiday')}: ${holiday.name}` : t(emptyKey)}
      </p>
    )
  }

  const todayAssignment = assignmentsByDate.get(todayKey)
  const todayShift = todayAssignment?.shiftTemplateId ? shiftTemplatesById.get(todayAssignment.shiftTemplateId) : undefined
  const todayAbsence = todayAssignment?.absenceTypeId ? absenceTypesById.get(todayAssignment.absenceTypeId) : undefined
  const todayHoliday = holidaysByDate.get(todayKey)

  const statusLabel = todayShift ? t('portal.workingStatus') : todayAbsence ? todayAbsence.name : t('portal.off')
  const statusColor = todayShift ? undefined : todayAbsence?.color

  const notifications = notificationsQuery.data?.items ?? []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">
          {t(greetingKey())}, {employee.firstName}
        </h1>
        <p className="text-sm text-muted-foreground">{t('portal.upcomingSubtitle')}</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('portal.statusTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {statusColor && <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: statusColor }} aria-hidden />}
            <p className={`text-2xl font-bold ${todayShift ? 'text-primary' : ''}`}>{statusLabel}</p>
          </div>
          {todayHoliday && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t('scheduler.holiday')}: {todayHoliday.name}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('portal.todayShiftTitle')}</CardTitle>
        </CardHeader>
        <CardContent>{renderDayCard(todayKey, 'portal.nothingToday')}</CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('common.tomorrow')}</CardTitle>
        </CardHeader>
        <CardContent>{renderDayCard(tomorrowKey, 'portal.nothingTomorrow')}</CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('portal.monthlyHours')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold tabular-nums">{formatHours(assignedHours)}</p>
              <p className="text-xs text-muted-foreground">{t('scheduler.assignedHours')}</p>
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">{formatHours(requiredHours)}</p>
              <p className="text-xs text-muted-foreground">{t('scheduler.requiredHours')}</p>
            </div>
            <div>
              <p className={`text-lg font-bold tabular-nums ${MONTHLY_HOURS_STATUS_COLORS[hoursStatus]}`}>
                {remaining >= 0 ? formatHours(remaining) : `−${formatHours(-remaining)}`}
              </p>
              <p className="text-xs text-muted-foreground">{t('scheduler.remaining')}</p>
            </div>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${PROGRESS_BAR_COLORS[hoursStatus]}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">{t('portal.latestNotifications')}</CardTitle>
          <Link to="/my-notifications" className="text-xs font-medium text-primary hover:underline">
            {t('common.viewAll')}
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('topbar.noNotifications')}</p>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-2.5">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.readAt ? 'bg-transparent' : 'bg-primary'}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t(NOTIFICATION_TITLE_KEYS[notification.type])}</p>
                  <p className="truncate text-xs text-muted-foreground">{notification.message}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
