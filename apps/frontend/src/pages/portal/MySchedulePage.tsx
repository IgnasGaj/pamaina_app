import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useSchedule, useSchedules } from '@/hooks/useSchedules'
import { useShiftTemplates } from '@/hooks/useShiftTemplates'
import { useAbsenceTypes } from '@/hooks/useAbsenceTypes'
import { useHolidays } from '@/hooks/useWorkingTime'
import { useOwnEmployeeProfile } from '@/hooks/useEmployees'
import { getErrorMessage } from '@/lib/errors'
import { getMonthNames, getWeekdayShortLabels, isTodayDate, isWeekendDate, isoWeekday, type AppLocale } from '@/lib/date'
import { dateKey, daysInMonth } from '@/pages/scheduler/schedule-grid.utils'
import { DayDetailSheet } from '@/pages/portal/DayDetailSheet'
import type { AbsenceType } from '@/types/absence-type.types'
import type { ScheduleAssignment } from '@/types/schedule.types'
import type { ShiftTemplate } from '@/types/shift-template.types'
import type { Holiday } from '@/types/working-time.types'

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const zeroBased = month - 1 + delta
  return { year: year + Math.floor(zeroBased / 12), month: ((zeroBased % 12) + 12) % 12 + 1 }
}

/** One month's published schedule, self-service-scoped to the caller's own assignments. */
function useMonthSchedule(year: number, month: number) {
  const summaryQuery = useSchedules({ year, month, pageSize: 1 })
  const summary = summaryQuery.data?.items[0]
  const scheduleQuery = useSchedule(summary?.id)
  return { summaryQuery, summary, scheduleQuery }
}

export function MySchedulePage() {
  const { t, i18n } = useTranslation()
  const locale: AppLocale = i18n.language === 'en' ? 'en' : 'lt'
  const monthLabels = getMonthNames(locale)
  const weekdayLabels = getWeekdayShortLabels(locale)
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined)

  const prevMonth = addMonths(year, month, -1)
  const nextMonth = addMonths(year, month, 1)

  const profileQuery = useOwnEmployeeProfile()
  const current = useMonthSchedule(year, month)
  const prev = useMonthSchedule(prevMonth.year, prevMonth.month)
  const next = useMonthSchedule(nextMonth.year, nextMonth.month)

  const shiftTemplatesQuery = useShiftTemplates({ pageSize: 100 })
  const absenceTypesQuery = useAbsenceTypes({ pageSize: 100 })

  const holidaysCurrent = useHolidays({ year, month })
  const holidaysPrev = useHolidays({ year: prevMonth.year, month: prevMonth.month })
  const holidaysNext = useHolidays({ year: nextMonth.year, month: nextMonth.month })

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
    for (const assignment of [
      ...(prev.scheduleQuery.data?.assignments ?? []),
      ...(current.scheduleQuery.data?.assignments ?? []),
      ...(next.scheduleQuery.data?.assignments ?? []),
    ]) {
      map.set(assignment.date, assignment)
    }
    return map
  }, [prev.scheduleQuery.data, current.scheduleQuery.data, next.scheduleQuery.data])

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, Holiday>()
    for (const holiday of [...(holidaysPrev.data ?? []), ...(holidaysCurrent.data ?? []), ...(holidaysNext.data ?? [])]) {
      map.set(holiday.date, holiday)
    }
    return map
  }, [holidaysPrev.data, holidaysCurrent.data, holidaysNext.data])

  const days = useMemo(() => {
    const total = daysInMonth(year, month)
    return Array.from({ length: total }, (_, i) => dateKey(year, month, i + 1))
  }, [year, month])

  const leadingBlanks = isoWeekday(days[0]) - 1
  const trailingBlanks = (7 - ((leadingBlanks + days.length) % 7)) % 7
  const fetchedRangeStart = dateKey(prevMonth.year, prevMonth.month, 1)
  const fetchedRangeEnd = dateKey(nextMonth.year, nextMonth.month, daysInMonth(nextMonth.year, nextMonth.month))

  function goToMonth(delta: number) {
    const target = addMonths(year, month, delta)
    setYear(target.year)
    setMonth(target.month)
  }

  function handleNavigateDay(delta: 1 | -1) {
    if (!selectedDate) return
    const [y, m, d] = selectedDate.split('-').map(Number)
    const target = new Date(y, m - 1, d + delta)
    const candidate = dateKey(target.getFullYear(), target.getMonth() + 1, target.getDate())
    if (candidate < fetchedRangeStart || candidate > fetchedRangeEnd) return
    setSelectedDate(candidate)
  }

  const isLoading = current.summaryQuery.isLoading || (Boolean(current.summary) && current.scheduleQuery.isLoading)
  const hasError = current.summaryQuery.isError

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t('portal.mySchedule')}</h1>
        <p className="text-sm text-muted-foreground">{t('portal.publishedOnly')}</p>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="size-11" onClick={() => goToMonth(-1)} aria-label={t('common.previous')}>
          <ChevronLeft className="size-6" />
        </Button>
        <p className="text-base font-semibold capitalize">
          {monthLabels[month - 1]} {year}
        </p>
        <Button variant="ghost" size="icon" className="size-11" onClick={() => goToMonth(1)} aria-label={t('common.nextPage')}>
          <ChevronRight className="size-6" />
        </Button>
      </div>

      {hasError && <p className="py-8 text-center text-sm text-destructive">{getErrorMessage(current.summaryQuery.error)}</p>}

      {!hasError && isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t('portal.loadingSchedule')}
        </div>
      )}

      {!hasError && !isLoading && !current.summary && (
        <Card className="rounded-2xl">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t('portal.noPublishedSchedule', { month: monthLabels[month - 1], year })}
          </CardContent>
        </Card>
      )}

      {!hasError && !isLoading && current.summary && (
        <>
          <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
            {weekdayLabels.map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <div key={`lead-${i}`} />
            ))}
            {days.map((date) => {
              const assignment = assignmentsByDate.get(date)
              const shift = assignment?.shiftTemplateId ? shiftTemplatesById.get(assignment.shiftTemplateId) : undefined
              const absence = assignment?.absenceTypeId ? absenceTypesById.get(assignment.absenceTypeId) : undefined
              const color = shift?.color ?? absence?.color
              const holiday = holidaysByDate.get(date)
              const dayNumber = Number(date.slice(-2))
              const today_ = isTodayDate(date)
              const weekend = isWeekendDate(date)

              let cellClass = 'bg-transparent'
              if (!color) {
                if (holiday?.source === 'default') cellClass = 'bg-red-100 dark:bg-red-950/50'
                else if (holiday?.source === 'company') cellClass = 'bg-amber-100 dark:bg-amber-950/50'
                else if (weekend) cellClass = 'bg-muted/60'
              }

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  style={color ? { backgroundColor: `${color}1f` } : undefined}
                  className={`relative flex aspect-square min-h-11 flex-col items-center justify-center rounded-xl text-sm font-medium transition-colors active:scale-95 ${cellClass} ${today_ ? 'ring-2 ring-primary' : ''}`}
                >
                  <span className={today_ ? 'font-bold text-primary' : ''}>{dayNumber}</span>
                  {color && <span className="absolute bottom-1.5 size-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />}
                </button>
              )
            })}
            {Array.from({ length: trailingBlanks }, (_, i) => (
              <div key={`trail-${i}`} />
            ))}
          </div>
        </>
      )}

      <DayDetailSheet
        date={selectedDate}
        onOpenChange={(open) => !open && setSelectedDate(undefined)}
        onNavigate={handleNavigateDay}
        assignmentsByDate={assignmentsByDate}
        holidaysByDate={holidaysByDate}
        shiftTemplatesById={shiftTemplatesById}
        absenceTypesById={absenceTypesById}
        departmentName={profileQuery.data?.departmentName ?? null}
        locale={locale}
      />
    </div>
  )
}
