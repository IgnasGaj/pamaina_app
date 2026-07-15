import { useTranslation } from 'react-i18next'

import { getWeekdayShortLabels, isTodayDate, isWeekendDate, isoWeekday, type AppLocale } from '@/lib/date'
import { EmployeeRow, type EmployeeMonthlyHours } from '@/pages/scheduler/EmployeeRow'
import type { CellActionParams } from '@/pages/scheduler/ScheduleCell'
import type { AbsenceType } from '@/types/absence-type.types'
import type { Employee, EmploymentType } from '@/types/employee.types'
import type { ScheduleAssignment } from '@/types/schedule.types'
import type { ShiftTemplate } from '@/types/shift-template.types'
import type { Holiday, MonthlyHoursBreakdown } from '@/types/working-time.types'

export function ScheduleGrid({
  roster,
  days,
  assignmentsByKey,
  shiftTemplatesById,
  absenceTypesById,
  availableTemplates,
  availableAbsenceTypes,
  holidaysByDate,
  hoursByEmployee,
  requiredHoursByEmploymentType,
  disabled,
  locale,
  onAction,
}: {
  roster: Employee[]
  days: string[]
  assignmentsByKey: Map<string, ScheduleAssignment>
  shiftTemplatesById: Map<string, ShiftTemplate>
  absenceTypesById: Map<string, AbsenceType>
  availableTemplates: ShiftTemplate[]
  availableAbsenceTypes: AbsenceType[]
  holidaysByDate: Map<string, Holiday>
  hoursByEmployee: Map<string, EmployeeMonthlyHours>
  requiredHoursByEmploymentType: Map<EmploymentType, MonthlyHoursBreakdown>
  disabled: boolean
  locale: AppLocale
  onAction: (params: CellActionParams) => void
}) {
  const { t } = useTranslation()
  const weekdayLabels = getWeekdayShortLabels(locale)

  return (
    <div className="overflow-auto rounded-lg border border-border" style={{ maxHeight: 'calc(100vh - 340px)' }}>
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-20 bg-background">
          <tr className="border-b border-border">
            <th className="sticky left-0 z-30 min-w-64 border-r border-border bg-background px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              {t('scheduler.employee')}
            </th>
            {days.map((date) => {
              const holiday = holidaysByDate.get(date)
              const weekend = isWeekendDate(date)
              const today = isTodayDate(date)
              const weekdayLabel = weekdayLabels[isoWeekday(date) - 1]
              const headerTint = holiday
                ? holiday.source === 'default'
                  ? 'bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200'
                  : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                : weekend
                  ? 'bg-muted/60 text-muted-foreground'
                  : 'text-muted-foreground'
              return (
                <th
                  key={date}
                  title={holiday ? `${holiday.source === 'default' ? t('scheduler.holiday') : t('scheduler.companyNonWorkingDay')}: ${holiday.name}` : undefined}
                  className={`min-w-9 px-0.5 py-1 text-center text-xs font-medium ${headerTint} ${today ? 'ring-2 ring-primary ring-inset' : ''}`}
                >
                  <div className="leading-tight font-normal">{weekdayLabel}</div>
                  <div className={today ? 'font-bold text-primary' : 'font-medium'}>{Number(date.slice(-2))}</div>
                </th>
              )
            })}
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
              holidaysByDate={holidaysByDate}
              hours={hoursByEmployee.get(employee.id)}
              requiredBreakdown={requiredHoursByEmploymentType.get(employee.employmentType)}
              disabled={disabled}
              locale={locale}
              onAction={onAction}
            />
          ))}
          {roster.length === 0 && (
            <tr>
              <td colSpan={days.length + 1} className="py-8 text-center text-sm text-muted-foreground">
                {t('scheduler.noEmployeesMatch')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
