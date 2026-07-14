import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatHours, getMonthlyHoursStatus, MONTHLY_HOURS_STATUS_COLORS } from '@/lib/monthly-hours'
import { ScheduleCell, type CellActionParams } from '@/pages/scheduler/ScheduleCell'
import { cellKey } from '@/pages/scheduler/schedule-grid.utils'
import type { AbsenceType } from '@/types/absence-type.types'
import type { Employee } from '@/types/employee.types'
import type { ScheduleAssignment } from '@/types/schedule.types'
import type { ShiftTemplate } from '@/types/shift-template.types'

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export interface EmployeeMonthlyHours {
  assigned: number
  required: number
}

export function EmployeeRow({
  employee,
  days,
  assignmentsByKey,
  shiftTemplatesById,
  absenceTypesById,
  availableTemplates,
  availableAbsenceTypes,
  hours,
  disabled,
  onAction,
}: {
  employee: Employee
  days: string[]
  assignmentsByKey: Map<string, ScheduleAssignment>
  shiftTemplatesById: Map<string, ShiftTemplate>
  absenceTypesById: Map<string, AbsenceType>
  availableTemplates: ShiftTemplate[]
  availableAbsenceTypes: AbsenceType[]
  hours: EmployeeMonthlyHours | undefined
  disabled: boolean
  onAction: (params: CellActionParams) => void
}) {
  const employeeName = `${employee.firstName} ${employee.lastName}`
  const hoursStatus = hours ? getMonthlyHoursStatus(hours.assigned, hours.required) : undefined
  const isSchedulable = employee.status === 'ACTIVE'

  return (
    <tr className="border-b border-border">
      <td className="sticky left-0 z-10 min-w-64 border-r border-border bg-background px-3 py-2 align-middle">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback>{initials(employee.firstName, employee.lastName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{employeeName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {employee.departmentName ?? '—'} · {employee.positionTitle ?? '—'}
            </p>
          </div>
          <div className="shrink-0 text-right text-xs">
            {hours ? (
              <span className={`font-medium tabular-nums ${MONTHLY_HOURS_STATUS_COLORS[hoursStatus!]}`}>
                {formatHours(hours.assigned)} / {formatHours(hours.required)} h
              </span>
            ) : (
              <span className="text-muted-foreground">Inactive</span>
            )}
          </div>
        </div>
      </td>
      {days.map((date) => {
        const assignment = assignmentsByKey.get(cellKey(employee.id, date))
        return (
          <td key={date} className="p-0.5 text-center">
            <ScheduleCell
              employeeId={employee.id}
              date={date}
              assignment={assignment}
              shiftTemplate={assignment?.shiftTemplateId ? shiftTemplatesById.get(assignment.shiftTemplateId) : undefined}
              absenceType={assignment?.absenceTypeId ? absenceTypesById.get(assignment.absenceTypeId) : undefined}
              availableTemplates={availableTemplates}
              availableAbsenceTypes={availableAbsenceTypes}
              disabled={disabled || !isSchedulable}
              employeeName={employeeName}
              departmentName={employee.departmentName}
              positionTitle={employee.positionTitle}
              onAction={onAction}
            />
          </td>
        )
      })}
    </tr>
  )
}
