import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScheduleCell, type CellActionParams } from '@/pages/scheduler/ScheduleCell'
import { cellKey } from '@/pages/scheduler/schedule-grid.utils'
import type { EmploymentContract } from '@/types/contract.types'
import type { Employee } from '@/types/employee.types'
import type { ScheduleAssignment } from '@/types/schedule.types'

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function EmployeeRow({
  employee,
  contract,
  days,
  assignmentsByKey,
  disabled,
  onAction,
}: {
  employee: Employee
  contract: EmploymentContract | null
  days: string[]
  assignmentsByKey: Map<string, ScheduleAssignment>
  disabled: boolean
  onAction: (params: CellActionParams) => void
}) {
  const employeeName = `${employee.firstName} ${employee.lastName}`

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
              {contract?.departmentName ?? '—'} · {contract?.positionTitle ?? '—'}
            </p>
          </div>
          <div className="shrink-0 text-right text-xs text-muted-foreground">
            {contract ? `${contract.weeklyHours}h/wk` : 'No contract'}
          </div>
        </div>
      </td>
      {days.map((date) => (
        <td key={date} className="p-0.5 text-center">
          <ScheduleCell
            employeeId={employee.id}
            contractId={contract?.id ?? null}
            date={date}
            assignment={assignmentsByKey.get(cellKey(employee.id, date))}
            disabled={disabled}
            employeeName={employeeName}
            departmentName={contract?.departmentName ?? null}
            positionTitle={contract?.positionTitle ?? null}
            onAction={onAction}
          />
        </td>
      ))}
    </tr>
  )
}
