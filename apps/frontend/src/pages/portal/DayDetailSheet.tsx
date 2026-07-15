import { useRef } from 'react'
import type { TouchEvent } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { BottomSheet } from '@/components/portal/BottomSheet'
import { formatDayMonth, getWeekdayFullLabels, isoWeekday, type AppLocale } from '@/lib/date'
import type { AbsenceType } from '@/types/absence-type.types'
import type { ScheduleAssignment } from '@/types/schedule.types'
import type { ShiftTemplate } from '@/types/shift-template.types'
import type { Holiday } from '@/types/working-time.types'

interface DayDetailSheetProps {
  date: string | undefined
  onOpenChange: (open: boolean) => void
  onNavigate: (delta: 1 | -1) => void
  assignmentsByDate: Map<string, ScheduleAssignment>
  holidaysByDate: Map<string, Holiday>
  shiftTemplatesById: Map<string, ShiftTemplate>
  absenceTypesById: Map<string, AbsenceType>
  departmentName: string | null
  locale: AppLocale
}

/** Swipe distance (px) that counts as an intentional day change rather than a scroll/tap. */
const SWIPE_THRESHOLD = 45

/**
 * The mobile "Day View" — opened from MySchedulePage's calendar grid. Stays
 * open across day changes (swipe left/right or the chevrons) so the
 * employee never has to return to the calendar to check adjacent days.
 */
export function DayDetailSheet({
  date,
  onOpenChange,
  onNavigate,
  assignmentsByDate,
  holidaysByDate,
  shiftTemplatesById,
  absenceTypesById,
  departmentName,
  locale,
}: DayDetailSheetProps) {
  const { t } = useTranslation()
  const touchStartX = useRef<number | null>(null)
  // Keeps rendering the last-viewed day's content while the sheet plays its
  // close animation, instead of flashing empty content as `date` clears.
  const lastDateRef = useRef<string | undefined>(undefined)
  if (date) lastDateRef.current = date
  const displayDate = date ?? lastDateRef.current

  function handleTouchStart(event: TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  function handleTouchEnd(event: TouchEvent) {
    if (touchStartX.current === null) return
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
    const delta = endX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    onNavigate(delta > 0 ? -1 : 1)
  }

  if (!displayDate) {
    return (
      <BottomSheet open={false} onOpenChange={onOpenChange} closeLabel={t('common.close')}>
        {null}
      </BottomSheet>
    )
  }

  const weekdayLabel = getWeekdayFullLabels(locale)[isoWeekday(displayDate) - 1]
  const dayMonthLabel = formatDayMonth(displayDate, locale)

  const assignment = assignmentsByDate.get(displayDate)
  const shift = assignment?.shiftTemplateId ? shiftTemplatesById.get(assignment.shiftTemplateId) : undefined
  const absence = assignment?.absenceTypeId ? absenceTypesById.get(assignment.absenceTypeId) : undefined
  const holiday = holidaysByDate.get(displayDate)

  return (
    <BottomSheet open={Boolean(date)} onOpenChange={onOpenChange} closeLabel={t('common.close')}>
      <DialogPrimitive.Title asChild>
        <div className="mb-1 flex items-center justify-between">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full active:bg-muted"
            onClick={() => onNavigate(-1)}
            aria-label={t('common.previous')}
          >
            <ChevronLeft className="size-6" />
          </button>
          <div className="text-center">
            <p className="text-lg font-bold">{weekdayLabel}</p>
            <p className="text-sm text-muted-foreground">{dayMonthLabel}</p>
          </div>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full active:bg-muted"
            onClick={() => onNavigate(1)}
            aria-label={t('common.nextPage')}
          >
            <ChevronRight className="size-6" />
          </button>
        </div>
      </DialogPrimitive.Title>

      <div
        key={displayDate}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="animate-in fade-in-0 duration-200 space-y-3 pt-2"
      >
        {(holiday || (!shift && !absence)) && (
          <div className="flex flex-wrap gap-2">
            {holiday && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  holiday.source === 'default'
                    ? 'bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200'
                    : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                }`}
              >
                {holiday.source === 'default' ? t('scheduler.holiday') : t('scheduler.companyNonWorkingDay')}:{' '}
                {holiday.name}
              </span>
            )}
          </div>
        )}

        {shift && (
          <div className="space-y-2 rounded-2xl bg-muted/50 p-4">
            <p className="text-2xl font-bold tabular-nums">
              {shift.startTime}–{shift.endTime}
            </p>
            <p className="text-base font-semibold">{shift.name}</p>
            <dl className="space-y-1.5 pt-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t('common.department')}</dt>
                <dd className="text-right font-medium">{departmentName ?? t('portal.noDepartment')}</dd>
              </div>
              {shift.breakMinutes > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t('shiftTemplates.break')}</dt>
                  <dd className="text-right font-medium">
                    {shift.breakMinutes} {t('shiftTemplates.minutesShort')}
                  </dd>
                </div>
              )}
            </dl>
            {assignment?.notes && (
              <div className="pt-1">
                <p className="text-xs font-medium text-muted-foreground">{t('common.notes')}</p>
                <p className="mt-0.5 text-sm">{assignment.notes}</p>
              </div>
            )}
          </div>
        )}

        {absence && (
          <div className="space-y-2 rounded-2xl bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: absence.color }} aria-hidden />
              <p className="text-base font-semibold">{absence.name}</p>
            </div>
            {assignment?.notes && (
              <div className="pt-1">
                <p className="text-xs font-medium text-muted-foreground">{t('common.notes')}</p>
                <p className="mt-0.5 text-sm">{assignment.notes}</p>
              </div>
            )}
          </div>
        )}

        {!shift && !absence && (
          <p className="rounded-2xl bg-muted/50 p-4 text-center text-sm text-muted-foreground">
            {t('portal.noAssignment')}
          </p>
        )}
      </div>
    </BottomSheet>
  )
}
