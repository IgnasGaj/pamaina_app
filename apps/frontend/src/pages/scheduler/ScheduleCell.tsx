import { memo, useState } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SHIFT_TYPE_CODES, SHIFT_TYPE_COLORS, SHIFT_TYPE_LABELS, SHIFT_TYPE_OPTIONS } from '@/lib/schedule-options'
import type { ScheduleAssignment, ShiftType } from '@/types/schedule.types'

export interface CellActionParams {
  employeeId: string
  contractId: string
  date: string
  assignmentId?: string
  shiftType: ShiftType | null
}

interface ScheduleCellProps {
  employeeId: string
  contractId: string | null
  date: string
  assignment: ScheduleAssignment | undefined
  disabled: boolean
  employeeName: string
  departmentName: string | null
  positionTitle: string | null
  onAction: (params: CellActionParams) => void
}

function ScheduleCellComponent({
  employeeId,
  contractId,
  date,
  assignment,
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
    assignment ? SHIFT_TYPE_LABELS[assignment.shiftType] : 'No shift',
    departmentName ?? 'No department',
    positionTitle ?? 'No position',
  ].join(' • ')

  function handleSelect(shiftType: ShiftType | null) {
    if (!contractId) return
    onAction({ employeeId, contractId, date, assignmentId: assignment?.id, shiftType })
    setOpen(false)
  }

  const trigger = (
    <button
      type="button"
      title={tooltip}
      disabled={!isInteractive}
      className={`flex size-9 items-center justify-center rounded text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        assignment ? SHIFT_TYPE_COLORS[assignment.shiftType] : 'bg-transparent text-muted-foreground hover:bg-accent'
      }`}
    >
      {assignment ? SHIFT_TYPE_CODES[assignment.shiftType] : ''}
    </button>
  )

  if (!isInteractive) {
    return trigger
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="center">
        <div className="flex flex-col">
          {SHIFT_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => handleSelect(option.value)}
            >
              <span className={`inline-block size-3 rounded-sm ${SHIFT_TYPE_COLORS[option.value].split(' ')[0]}`} />
              {option.label}
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
