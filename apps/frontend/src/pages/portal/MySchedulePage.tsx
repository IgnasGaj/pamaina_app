import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSchedule, useSchedules } from '@/hooks/useSchedules'
import { useShiftTemplates } from '@/hooks/useShiftTemplates'
import { useAbsenceTypes } from '@/hooks/useAbsenceTypes'
import { getErrorMessage } from '@/lib/errors'
import { getMonthNames, getWeekdayShortLabels, isTodayDate, isWeekendDate, isoWeekday, type AppLocale } from '@/lib/date'
import { dateKey, daysInMonth } from '@/pages/scheduler/schedule-grid.utils'
import type { AbsenceType } from '@/types/absence-type.types'
import type { ScheduleAssignment } from '@/types/schedule.types'
import type { ShiftTemplate } from '@/types/shift-template.types'

export function MySchedulePage() {
  const { t, i18n } = useTranslation()
  const locale: AppLocale = i18n.language === 'en' ? 'en' : 'lt'
  const monthLabels = getMonthNames(locale)
  const weekdayLabels = getWeekdayShortLabels(locale)
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const monthQuery = useSchedules({ year, month, pageSize: 1 })
  const scheduleSummary = monthQuery.data?.items[0]
  const scheduleQuery = useSchedule(scheduleSummary?.id)
  const shiftTemplatesQuery = useShiftTemplates({ pageSize: 100 })
  const absenceTypesQuery = useAbsenceTypes({ pageSize: 100 })

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
    for (const assignment of scheduleQuery.data?.assignments ?? []) {
      map.set(assignment.date, assignment)
    }
    return map
  }, [scheduleQuery.data])

  const days = useMemo(() => {
    const total = daysInMonth(year, month)
    return Array.from({ length: total }, (_, i) => dateKey(year, month, i + 1))
  }, [year, month])

  function goToMonth(delta: number) {
    const zeroBased = month - 1 + delta
    const nextYear = year + Math.floor(zeroBased / 12)
    const nextMonth = ((zeroBased % 12) + 12) % 12
    setYear(nextYear)
    setMonth(nextMonth + 1)
  }

  const isLoading = monthQuery.isLoading || (Boolean(scheduleSummary) && scheduleQuery.isLoading)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t('portal.mySchedule')}</h1>
        <p className="text-sm text-muted-foreground">{t('portal.publishedOnly')}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => goToMonth(-1)} aria-label={t('common.previous')}>
          <ChevronLeft />
        </Button>
        <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthLabels.map((label, index) => (
              <SelectItem key={label} value={String(index + 1)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 3 }, (_, i) => today.getFullYear() - 1 + i).map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => goToMonth(1)} aria-label={t('common.nextPage')}>
          <ChevronRight />
        </Button>
      </div>

      {monthQuery.isError && (
        <p className="py-8 text-center text-sm text-destructive">{getErrorMessage(monthQuery.error)}</p>
      )}

      {!monthQuery.isError && isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t('portal.loadingSchedule')}
        </div>
      )}

      {!monthQuery.isError && !isLoading && !scheduleSummary && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t('portal.noPublishedSchedule', { month: monthLabels[month - 1], year })}
          </CardContent>
        </Card>
      )}

      {!monthQuery.isError && !isLoading && scheduleSummary && (
        <div className="space-y-1.5">
          {days.map((date) => {
            const assignment = assignmentsByDate.get(date)
            const shift = assignment?.shiftTemplateId ? shiftTemplatesById.get(assignment.shiftTemplateId) : undefined
            const absence = assignment?.absenceTypeId ? absenceTypesById.get(assignment.absenceTypeId) : undefined
            const color = shift?.color ?? absence?.color
            const dayNumber = Number(date.slice(-2))
            const weekday = weekdayLabels[isoWeekday(date) - 1]
            const today_ = isTodayDate(date)
            const weekend = isWeekendDate(date)

            return (
              <Card key={date} className={today_ ? 'ring-2 ring-primary' : weekend ? 'bg-muted/40' : undefined}>
                <CardContent className="flex items-start gap-3 py-2.5">
                  <div className="w-12 shrink-0 text-center">
                    <p className="text-xs text-muted-foreground">{weekday}</p>
                    <p className={`text-lg font-semibold leading-tight ${today_ ? 'text-primary' : ''}`}>{dayNumber}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    {shift ? (
                      <>
                        <p className="text-sm font-medium">{shift.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {shift.startTime}-{shift.endTime}
                        </p>
                      </>
                    ) : absence ? (
                      <p className="text-sm font-medium">{absence.name}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t('portal.off')}</p>
                    )}
                    {assignment?.notes && (
                      <p className="mt-1 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {assignment.notes}
                      </p>
                    )}
                  </div>
                  {color && <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
