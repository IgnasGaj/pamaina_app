import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { formatLongDate, type AppLocale } from '@/lib/date'
import type { AbsenceType } from '@/types/absence-type.types'
import type { ScheduleAssignment } from '@/types/schedule.types'
import type { ShiftTemplate } from '@/types/shift-template.types'
import type { Holiday } from '@/types/working-time.types'

export interface CellActionParams {
  employeeId: string
  date: string
  assignmentId?: string
  shiftTemplateId: string | null
  absenceTypeId: string | null
  /** Only set when saving a note on an existing assignment — omitted (not touched) for plain shift/absence selection. */
  notes?: string | null
}

interface ScheduleCellProps {
  employeeId: string
  date: string
  assignment: ScheduleAssignment | undefined
  /** The assignment's resolved shift template, or undefined if it has none/was archived and removed. */
  shiftTemplate: ShiftTemplate | undefined
  /** The assignment's resolved absence type, or undefined if it has none/was archived and removed. */
  absenceType: AbsenceType | undefined
  /** Shift templates a manager may currently pick from — archived ones are excluded. */
  availableTemplates: ShiftTemplate[]
  /** Absence types a manager may currently pick from — archived ones are excluded. */
  availableAbsenceTypes: AbsenceType[]
  disabled: boolean
  employeeName: string
  departmentName: string | null
  positionTitle: string | null
  /** A Lithuanian public holiday or company non-working day on this date, if any — drives the red/amber background and tooltip. */
  holiday: Holiday | undefined
  isWeekend: boolean
  isToday: boolean
  locale: AppLocale
  onAction: (params: CellActionParams) => void
}

/** Picks readable text color for an arbitrary background hex color. */
function getContrastTextColor(hexColor: string): string {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#111827' : '#ffffff'
}

/** Absence types have no dedicated short code — the first 3 letters of the name fit the compact grid cell. */
function absenceShortLabel(name: string): string {
  return name.slice(0, 3).toUpperCase()
}

function ScheduleCellComponent({
  employeeId,
  date,
  assignment,
  shiftTemplate,
  absenceType,
  availableTemplates,
  availableAbsenceTypes,
  disabled,
  employeeName,
  departmentName,
  positionTitle,
  holiday,
  isWeekend,
  isToday,
  locale,
  onAction,
}: ScheduleCellProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [notesDraft, setNotesDraft] = useState(assignment?.notes ?? '')
  const isInteractive = !disabled

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setNotesDraft(assignment?.notes ?? '')
    }
    setOpen(nextOpen)
  }

  const entryLabel = shiftTemplate
    ? `${shiftTemplate.name} (${shiftTemplate.startTime}-${shiftTemplate.endTime})`
    : absenceType
      ? `${absenceType.name} (${absenceType.paid ? t('absenceTypes.paid') : t('absenceTypes.unpaid')})`
      : t('scheduler.noShift')

  const tooltipParts = [
    employeeName,
    formatLongDate(date, locale),
    entryLabel,
    departmentName ?? t('employees.noDepartment'),
    positionTitle ?? t('employees.noPosition'),
  ]
  if (holiday) {
    tooltipParts.push(`${holiday.source === 'default' ? t('scheduler.holiday') : t('scheduler.companyNonWorkingDay')}: ${holiday.name}`)
  }
  const tooltip = tooltipParts.join(' • ')

  function handleSelectShift(shiftTemplateId: string) {
    onAction({ employeeId, date, assignmentId: assignment?.id, shiftTemplateId, absenceTypeId: null })
    setOpen(false)
  }

  function handleSelectAbsence(absenceTypeId: string) {
    onAction({ employeeId, date, assignmentId: assignment?.id, shiftTemplateId: null, absenceTypeId })
    setOpen(false)
  }

  function handleClear() {
    onAction({ employeeId, date, assignmentId: assignment?.id, shiftTemplateId: null, absenceTypeId: null })
    setOpen(false)
  }

  function handleSaveNotes() {
    if (!assignment) return
    onAction({
      employeeId,
      date,
      assignmentId: assignment.id,
      shiftTemplateId: assignment.shiftTemplateId,
      absenceTypeId: assignment.absenceTypeId,
      notes: notesDraft.trim() || null,
    })
    setOpen(false)
  }

  const color = shiftTemplate?.color ?? absenceType?.color
  const cellStyle = color ? { backgroundColor: color, color: getContrastTextColor(color) } : undefined
  const label = shiftTemplate ? shiftTemplate.shortCode : absenceType ? absenceShortLabel(absenceType.name) : ''

  // A shift/absence color always wins; otherwise an empty cell is subtly
  // tinted so the calendar's structure (weekend/holiday/today) stays visible
  // even before anything has been scheduled.
  const emptyCellClass = color
    ? ''
    : holiday?.source === 'default'
      ? 'bg-red-50 dark:bg-red-950/40'
      : holiday?.source === 'company'
        ? 'bg-amber-50 dark:bg-amber-950/40'
        : isWeekend
          ? 'bg-muted/60'
          : 'bg-transparent'

  const trigger = (
    <button
      type="button"
      title={tooltip}
      disabled={!isInteractive}
      style={cellStyle}
      className={`flex size-9 items-center justify-center rounded text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        color ? 'hover:brightness-95' : `text-muted-foreground hover:bg-accent ${emptyCellClass}`
      } ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}
    >
      {label}
    </button>
  )

  if (!isInteractive) {
    return trigger
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="center">
        <div className="flex flex-col">
          {availableTemplates.length === 0 && availableAbsenceTypes.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">{t('scheduler.noTemplatesOrTypesYet')}</p>
          )}

          {availableTemplates.length > 0 && (
            <p className="px-2 pt-1 pb-0.5 text-xs font-medium text-muted-foreground">{t('scheduler.shifts')}</p>
          )}
          {availableTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => handleSelectShift(template.id)}
            >
              <span
                className="inline-block size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: template.color }}
                aria-hidden
              />
              <span className="flex-1 truncate">{template.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {template.startTime}-{template.endTime}
              </span>
            </button>
          ))}

          {availableAbsenceTypes.length > 0 && (
            <p className="px-2 pt-2 pb-0.5 text-xs font-medium text-muted-foreground">{t('scheduler.absences')}</p>
          )}
          {availableAbsenceTypes.map((absence) => (
            <button
              key={absence.id}
              type="button"
              className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => handleSelectAbsence(absence.id)}
            >
              <span
                className="inline-block size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: absence.color }}
                aria-hidden
              />
              <span className="flex-1 truncate">{absence.name}</span>
            </button>
          ))}

          {assignment && (
            <>
              <button
                type="button"
                className="mt-1 rounded border-t border-border px-2 py-1.5 pt-2 text-left text-sm text-destructive hover:bg-accent"
                onClick={handleClear}
              >
                {t('scheduler.clear')}
              </button>
              <div className="mt-1 border-t border-border px-2 pt-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor={`notes-${assignment.id}`}>
                  {t('scheduler.noteLabel')}
                </label>
                <Textarea
                  id={`notes-${assignment.id}`}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder={t('scheduler.notePlaceholder')}
                  rows={2}
                  className="text-sm"
                />
                <Button size="sm" className="mt-1.5 w-full" onClick={handleSaveNotes}>
                  {t('scheduler.saveNote')}
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const ScheduleCell = memo(ScheduleCellComponent)
