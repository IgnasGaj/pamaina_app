import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOwnEmployeeProfile } from '@/hooks/useEmployees'
import { useSchedule, useSchedules } from '@/hooks/useSchedules'
import { useMonthlyHours } from '@/hooks/useWorkingTime'
import { useRequests } from '@/hooks/useRequests'
import { useShiftTemplates } from '@/hooks/useShiftTemplates'
import { useAbsenceTypes } from '@/hooks/useAbsenceTypes'
import {
  calculateShiftDurationHours,
  formatHours,
  getMonthlyHoursStatus,
  MONTHLY_HOURS_STATUS_COLORS,
} from '@/lib/monthly-hours'
import { getErrorMessage } from '@/lib/errors'
import { getMonthNames, getWeekdayShortLabels, isoWeekday, type AppLocale } from '@/lib/date'
import type { AbsenceType } from '@/types/absence-type.types'
import type { ScheduleAssignment } from '@/types/schedule.types'
import type { ShiftTemplate } from '@/types/shift-template.types'

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
  const { t, i18n } = useTranslation()
  const locale: AppLocale = i18n.language === 'en' ? 'en' : 'lt'
  const monthLabels = getMonthNames(locale)
  const weekdayLabels = getWeekdayShortLabels(locale)
  function formatDayLabel(date: string): string {
    return `${weekdayLabels[isoWeekday(date) - 1]}, ${monthLabels[Number(date.slice(5, 7)) - 1]} ${Number(date.slice(-2))}`
  }
  const today = new Date()
  const todayKey = today.toISOString().slice(0, 10)
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

  const hoursQuery = useMonthlyHours(year, month, profileQuery.data?.employmentType ?? 'FULL_TIME')
  const shiftTemplatesQuery = useShiftTemplates({ pageSize: 100 })
  const absenceTypesQuery = useAbsenceTypes({ pageSize: 100 })
  const requestsQuery = useRequests({ pageSize: 100 })

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

  const allAssignments = useMemo(
    () => [...(currentScheduleQuery.data?.assignments ?? []), ...(nextScheduleQuery.data?.assignments ?? [])],
    [currentScheduleQuery.data, nextScheduleQuery.data],
  )

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

  const upcoming = useMemo(
    () => [...allAssignments].filter((a) => a.date >= todayKey).sort((a, b) => a.date.localeCompare(b.date)),
    [allAssignments, todayKey],
  )

  const nextShift = upcoming.find((assignment) => assignment.shiftTemplateId)
  const nextShiftTemplate = nextShift?.shiftTemplateId ? shiftTemplatesById.get(nextShift.shiftTemplateId) : undefined

  const tomorrowKey = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const in7DaysKey = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const todayList = upcoming.filter((a) => a.date === todayKey)
  const tomorrowList = upcoming.filter((a) => a.date === tomorrowKey)
  const next7DaysList = upcoming.filter((a) => a.date > tomorrowKey && a.date <= in7DaysKey)

  const requests = requestsQuery.data?.items ?? []
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length

  const isLoading = profileQuery.isLoading || currentMonthQuery.isLoading

  function renderAssignment(assignment: ScheduleAssignment) {
    const shift = assignment.shiftTemplateId ? shiftTemplatesById.get(assignment.shiftTemplateId) : undefined
    const absence = assignment.absenceTypeId ? absenceTypesById.get(assignment.absenceTypeId) : undefined
    const color = shift?.color ?? absence?.color ?? '#9CA3AF'
    return (
      <div key={assignment.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{formatDayLabel(assignment.date)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {shift ? `${shift.name} · ${shift.startTime}-${shift.endTime}` : (absence?.name ?? '—')}
          </p>
        </div>
      </div>
    )
  }

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">
          {t(greetingKey())}, {employee.firstName}
        </h1>
        <p className="text-sm text-muted-foreground">{t('portal.upcomingSubtitle')}</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('portal.nextShift')}</CardTitle>
        </CardHeader>
        <CardContent>
          {nextShift && nextShiftTemplate ? (
            <div>
              <p className="text-lg font-semibold">{formatDayLabel(nextShift.date)}</p>
              <p className="text-sm text-muted-foreground">
                {nextShiftTemplate.name} · {nextShiftTemplate.startTime}-{nextShiftTemplate.endTime}
              </p>
              <p className="text-xs text-muted-foreground">{employee.departmentName ?? t('portal.noDepartment')}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('portal.noUpcomingShift')}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('portal.monthlyHours')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold tabular-nums ${MONTHLY_HOURS_STATUS_COLORS[hoursStatus]}`}>
            {formatHours(assignedHours)} / {formatHours(requiredHours)} h
          </p>
          <p className="text-sm text-muted-foreground">
            {remaining >= 0
              ? `${t('scheduler.remaining')}: ${formatHours(remaining)} h`
              : `${t('scheduler.overBy')} ${formatHours(-remaining)} h`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('portal.upcomingShifts')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('common.today')}</p>
            {todayList.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('portal.nothingToday')}</p>
            ) : (
              <div className="space-y-1.5">{todayList.map(renderAssignment)}</div>
            )}
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('common.tomorrow')}</p>
            {tomorrowList.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('portal.nothingTomorrow')}</p>
            ) : (
              <div className="space-y-1.5">{tomorrowList.map(renderAssignment)}</div>
            )}
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('common.next7Days')}</p>
            {next7DaysList.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('portal.nothingNext7Days')}</p>
            ) : (
              <div className="space-y-1.5">{next7DaysList.map(renderAssignment)}</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">{t('portal.myRequests')}</CardTitle>
          <Link to="/my-requests" className="text-xs font-medium text-primary hover:underline">
            {t('common.viewAll')}
          </Link>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Badge variant="secondary">{t('requests.pending')}: {pendingCount}</Badge>
          <Badge variant="success">{t('requests.approved')}: {approvedCount}</Badge>
          <Badge variant="destructive">{t('requests.rejected')}: {rejectedCount}</Badge>
        </CardContent>
      </Card>
    </div>
  )
}
