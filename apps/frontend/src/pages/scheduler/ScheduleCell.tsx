import { memo, useState } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { ScheduleAssignment } from '@/types/schedule.types'
import type { ShiftTemplate } from '@/types/shift-template.types'

export interface CellActionParams {
  employeeId: string
  contractId: string
  date: string
  assignmentId?: string
  shiftTemplateId: string | null
}

interface ScheduleCellProps {
  employeeId: string
  contractId: string | null
  date: string
  assignment: ScheduleAssignment | undefined
  /** The assignment's resolved shift template, or undefined if it has none/was archived and removed. */
  shiftTemplate: ShiftTemplate | undefined
  /** Templates a manager may currently pick from — archived ones are excluded. */
  availableTemplates: ShiftTemplate[]
  disabled: boolean
  employeeName: string
  departmentName: string | null
  positionTitle: string | null
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

function ScheduleCellComponent({
  employeeId,
  contractId,
  date,
  assignment,
  shiftTemplate,
  availableTemplates,
  disabled,
  employeeName,
  departmentName,
  positionTitle,
  onAction,
}: ScheduleCellProps) {
  const [open, setOpen] = useState(false)
  const isInteractive = !disabled && Boolean(contractId)

  const tooltip = [
    employeeName,
    new Date(date).toLocaleDateString(),
    shiftTemplate ? `${shiftTemplate.name} (${shiftTemplate.startTime}-${shiftTemplate.endTime})` : 'No shift',
    departmentName ?? 'No department',
    positionTitle ?? 'No position',
  ].join(' • ')

  function handleSelect(shiftTemplateId: string | null) {
    if (!contractId) return
    onAction({ employeeId, contractId, date, assignmentId: assignment?.id, shiftTemplateId })
    setOpen(false)
  }

  const cellStyle = shiftTemplate
    ? { backgroundColor: shiftTemplate.color, color: getContrastTextColor(shiftTemplate.color) }
    : undefined

  const trigger = (
    <button
      type="button"
      title={tooltip}
      disabled={!isInteractive}
      style={cellStyle}
      className={`flex size-9 items-center justify-center rounded text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        shiftTemplate ? 'hover:brightness-95' : 'bg-transparent text-muted-foreground hover:bg-accent'
      }`}
    >
      {shiftTemplate ? shiftTemplate.shortCode : ''}
    </button>
  )

  if (!isInteractive) {
    return trigger
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="center">
        <div className="flex flex-col">
          {availableTemplates.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              No shift templates yet. Create one from the Shift templates page first.
            </p>
          )}
          {availableTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => handleSelect(template.id)}
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
          {assignment && (
            <button
              type="button"
              className="mt-1 rounded border-t border-border px-2 py-1.5 pt-2 text-left text-sm text-destructive hover:bg-accent"
              onClick={() => handleSelect(null)}
            >
              Clear
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const ScheduleCell = memo(ScheduleCellComponent)
