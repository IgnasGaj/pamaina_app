import { EmployeeRow, type EmployeeMonthlyHours } from '@/pages/scheduler/EmployeeRow'
import type { CellActionParams } from '@/pages/scheduler/ScheduleCell'
import type { AbsenceType } from '@/types/absence-type.types'
import type { Employee } from '@/types/employee.types'
import type { ScheduleAssignment } from '@/types/schedule.types'
import type { ShiftTemplate } from '@/types/shift-template.types'

export function ScheduleGrid({
  roster,
  days,
  assignmentsByKey,
  shiftTemplatesById,
  absenceTypesById,
  availableTemplates,
  availableAbsenceTypes,
  hoursByEmployee,
  disabled,
  onAction,
}: {
  roster: Employee[]
  days: string[]
  assignmentsByKey: Map<string, ScheduleAssignment>
  shiftTemplatesById: Map<string, ShiftTemplate>
  absenceTypesById: Map<string, AbsenceType>
  availableTemplates: ShiftTemplate[]
  availableAbsenceTypes: AbsenceType[]
  hoursByEmployee: Map<string, EmployeeMonthlyHours>
  disabled: boolean
  onAction: (params: CellActionParams) => void
}) {
  return (
    <div className="overflow-auto rounded-lg border border-border" style={{ maxHeight: 'calc(100vh - 340px)' }}>
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-20 bg-background">
          <tr className="border-b border-border">
            <th className="sticky left-0 z-30 min-w-64 border-r border-border bg-background px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Employee
            </th>
            {days.map((date) => (
              <th
                key={date}
                className="min-w-9 px-0.5 py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {Number(date.slice(-2))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roster.map((employee) => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              days={days}
              assignmentsByKey={assignmentsByKey}
              shiftTemplatesById={shiftTemplatesById}
              absenceTypesById={absenceTypesById}
              availableTemplates={availableTemplates}
              availableAbsenceTypes={availableAbsenceTypes}
              hours={hoursByEmployee.get(employee.id)}
              disabled={disabled}
              onAction={onAction}
            />
          ))}
          {roster.length === 0 && (
            <tr>
              <td colSpan={days.length + 1} className="py-8 text-center text-sm text-muted-foreground">
                No employees match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
