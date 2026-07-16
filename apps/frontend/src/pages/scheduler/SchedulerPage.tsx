import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Copy, Download, Loader2, Pencil, Plus, Printer, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ScheduleExportDialog } from '@/pages/scheduler/ScheduleExportDialog'
import type { ScheduleExportFormat } from '@/types/schedule-export.types'
import { useAbsenceTypes } from '@/hooks/useAbsenceTypes'
import { useDepartments } from '@/hooks/useDepartments'
import { usePositions } from '@/hooks/usePositions'
import { useSchedulerRoster } from '@/hooks/useSchedulerRoster'
import {
  useCopyPreviousMonth,
  useCreateAssignment,
  useCreateSchedule,
  useDeleteAssignment,
  usePublishSchedule,
  useSchedule,
  useSchedules,
  useUpdateAssignment,
} from '@/hooks/useSchedules'
import { useShiftTemplates } from '@/hooks/useShiftTemplates'
import { useHolidays, useMonthlyHoursByEmploymentType } from '@/hooks/useWorkingTime'
import { getErrorMessage } from '@/lib/errors'
import { calculateShiftDurationHours } from '@/lib/monthly-hours'
import { getMonthNames, type AppLocale } from '@/lib/date'
import type { EmployeeMonthlyHours } from '@/pages/scheduler/EmployeeRow'
import { ScheduleGrid } from '@/pages/scheduler/ScheduleGrid'
import type { CellActionParams } from '@/pages/scheduler/ScheduleCell'
import { cellKey, dateKey, daysInMonth } from '@/pages/scheduler/schedule-grid.utils'
import { ABSENCE_TYPE_CODE_ORDER, type AbsenceType } from '@/types/absence-type.types'
import type { ScheduleAssignment } from '@/types/schedule.types'
import type { ShiftTemplate } from '@/types/shift-template.types'
import type { Holiday } from '@/types/working-time.types'

const NONE_VALUE = '__all__'

type SortBy = 'name' | 'department' | 'position'

export function SchedulerPage() {
  const { t, i18n } = useTranslation()
  const locale: AppLocale = i18n.language === 'en' ? 'en' : 'lt'
  const monthLabels = getMonthNames(locale)
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [departmentFilter, setDepartmentFilter] = useState(NONE_VALUE)
  const [positionFilter, setPositionFilter] = useState(NONE_VALUE)
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [editingUnlocked, setEditingUnlocked] = useState(false)
  const [confirmEditOpen, setConfirmEditOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ScheduleExportFormat | null>(null)

  const rosterQuery = useSchedulerRoster()
  const departmentsQuery = useDepartments({ pageSize: 100 })
  const positionsQuery = usePositions({ pageSize: 100 })
  const shiftTemplatesQuery = useShiftTemplates({ pageSize: 100 })
  const absenceTypesQuery = useAbsenceTypes({ pageSize: 100 })
  const holidaysQuery = useHolidays({ year, month })
  // The Scheduler never computes required hours itself — it asks the
  // Lithuanian Working Time Engine once per employment type (max 4 calls)
  // and maps each employee to their type's result. See useWorkingTime.ts.
  const requiredHours = useMonthlyHoursByEmploymentType(year, month)

  const monthQuery = useSchedules({ year, month, pageSize: 1 })
  const scheduleSummary = monthQuery.data?.items[0]
  const scheduleQuery = useSchedule(scheduleSummary?.id)
  const schedule = scheduleQuery.data

  const createSchedule = useCreateSchedule()
  const publishSchedule = usePublishSchedule(schedule?.id ?? '')
  const copyPreviousMonth = useCopyPreviousMonth(schedule?.id ?? '')
  const createAssignment = useCreateAssignment(schedule?.id ?? '')
  const updateAssignment = useUpdateAssignment(schedule?.id ?? '')
  const deleteAssignment = useDeleteAssignment(schedule?.id ?? '')

  const scheduleId = schedule?.id
  const createMutate = createAssignment.mutate
  const updateMutate = updateAssignment.mutate
  const deleteMutate = deleteAssignment.mutate

  // A published schedule always re-opens locked — the confirmation dialog is
  // a deliberate, per-visit safeguard against accidental edits, not a
  // one-time unlock.
  useEffect(() => {
    setEditingUnlocked(false)
  }, [scheduleId])

  // A single stable callback shared by every cell in the grid (up to ~9,300
  // of them) — depending only on the mutate functions themselves (which
  // React Query keeps referentially stable) rather than on the mutation
  // result objects means this identity survives re-renders caused by
  // filtering/sorting, which is what lets ScheduleCell's memoization work.
  const handleCellAction = useCallback(
    (params: CellActionParams) => {
      if (!scheduleId) return
      const onError = (error: unknown): void => {
        toast.error(getErrorMessage(error))
      }

      if (params.shiftTemplateId === null && params.absenceTypeId === null) {
        if (params.assignmentId) {
          deleteMutate(params.assignmentId, { onError })
        }
        return
      }

      if (params.assignmentId) {
        updateMutate(
          {
            id: params.assignmentId,
            payload: {
              shiftTemplateId: params.shiftTemplateId,
              absenceTypeId: params.absenceTypeId,
              notes: params.notes,
            },
          },
          { onError },
        )
      } else {
        createMutate(
          {
            scheduleId,
            employeeId: params.employeeId,
            date: params.date,
            shiftTemplateId: params.shiftTemplateId ?? undefined,
            absenceTypeId: params.absenceTypeId ?? undefined,
          },
          { onError },
        )
      }
    },
    [scheduleId, createMutate, updateMutate, deleteMutate],
  )

  const days = useMemo(() => {
    const total = daysInMonth(year, month)
    return Array.from({ length: total }, (_, i) => dateKey(year, month, i + 1))
  }, [year, month])

  const assignmentsByKey = useMemo(() => {
    const map = new Map<string, ScheduleAssignment>()
    if (schedule) {
      for (const assignment of schedule.assignments) {
        map.set(cellKey(assignment.employeeId, assignment.date), assignment)
      }
    }
    return map
  }, [schedule])

  const shiftTemplatesById = useMemo(() => {
    const map = new Map<string, ShiftTemplate>()
    for (const template of shiftTemplatesQuery.data?.items ?? []) {
      map.set(template.id, template)
    }
    return map
  }, [shiftTemplatesQuery.data])

  const availableTemplates = useMemo(
    () => (shiftTemplatesQuery.data?.items ?? []).filter((template) => template.active),
    [shiftTemplatesQuery.data],
  )

  const absenceTypesById = useMemo(() => {
    const map = new Map<string, AbsenceType>()
    for (const absenceType of absenceTypesQuery.data?.items ?? []) {
      map.set(absenceType.id, absenceType)
    }
    return map
  }, [absenceTypesQuery.data])

  // isDefault excludes any legacy leftover types from before the fixed
  // 4-type model — only Pamaina's four standard absences are assignable,
  // always shown in the same P/A/M/L order.
  const availableAbsenceTypes = useMemo(
    () =>
      (absenceTypesQuery.data?.items ?? [])
        .filter((absenceType) => absenceType.active && absenceType.isDefault)
        .sort((a, b) => ABSENCE_TYPE_CODE_ORDER.indexOf(a.code) - ABSENCE_TYPE_CODE_ORDER.indexOf(b.code)),
    [absenceTypesQuery.data],
  )

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, Holiday>()
    for (const holiday of holidaysQuery.data ?? []) {
      map.set(holiday.date, holiday)
    }
    return map
  }, [holidaysQuery.data])

  // Structural memoization: only employees whose assigned/required numbers
  // actually changed get a new result object. Combined with ScheduleCell's
  // own memo, this is what keeps a single shift edit from re-rendering the
  // other ~299 rows in a full roster.
  const previousHoursRef = useRef<Map<string, EmployeeMonthlyHours>>(new Map())
  const hoursByEmployee = useMemo(() => {
    const next = new Map<string, EmployeeMonthlyHours>()
    if (!schedule) {
      previousHoursRef.current = next
      return next
    }

    const assignmentsByEmployeeId = new Map<string, ScheduleAssignment[]>()
    for (const assignment of schedule.assignments) {
      const list = assignmentsByEmployeeId.get(assignment.employeeId)
      if (list) list.push(assignment)
      else assignmentsByEmployeeId.set(assignment.employeeId, [assignment])
    }

    for (const employee of rosterQuery.data ?? []) {
      if (employee.status !== 'ACTIVE') continue
      const employeeAssignments = assignmentsByEmployeeId.get(employee.id) ?? []
      const assigned = employeeAssignments.reduce((total, assignment) => {
        const template = assignment.shiftTemplateId ? shiftTemplatesById.get(assignment.shiftTemplateId) : undefined
        return template ? total + calculateShiftDurationHours(template) : total
      }, 0)
      const required = requiredHours.byType.get(employee.employmentType)?.requiredHours ?? 0
      const roundedAssigned = Math.round(assigned * 100) / 100
      const roundedRequired = Math.round(required * 100) / 100

      const previous = previousHoursRef.current.get(employee.id)
      if (previous && previous.assigned === roundedAssigned && previous.required === roundedRequired) {
        next.set(employee.id, previous)
      } else {
        next.set(employee.id, { assigned: roundedAssigned, required: roundedRequired })
      }
    }
    previousHoursRef.current = next
    return next
  }, [rosterQuery.data, schedule, shiftTemplatesById, requiredHours.byType])

  const filteredRoster = useMemo(() => {
    let list = rosterQuery.data ?? []
    if (activeOnly) {
      list = list.filter((employee) => employee.status === 'ACTIVE')
    }
    if (departmentFilter !== NONE_VALUE) {
      list = list.filter((employee) => employee.departmentId === departmentFilter)
    }
    if (positionFilter !== NONE_VALUE) {
      list = list.filter((employee) => employee.positionId === positionFilter)
    }
    if (search.trim()) {
      const query = search.trim().toLowerCase()
      list = list.filter((employee) => `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(query))
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'department') {
        return (a.departmentName ?? '').localeCompare(b.departmentName ?? '')
      }
      if (sortBy === 'position') {
        return (a.positionTitle ?? '').localeCompare(b.positionTitle ?? '')
      }
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    })
  }, [rosterQuery.data, activeOnly, departmentFilter, positionFilter, search, sortBy])

  function goToMonth(deltaMonths: number) {
    const zeroBased = month - 1 + deltaMonths
    const nextYear = year + Math.floor(zeroBased / 12)
    const nextMonth = ((zeroBased % 12) + 12) % 12
    setYear(nextYear)
    setMonth(nextMonth + 1)
  }

  function jumpToToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth() + 1)
  }

  async function handleCreateSchedule() {
    try {
      await createSchedule.mutateAsync({ year, month })
      toast.success(t('scheduler.draftCreated'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handlePublish() {
    try {
      await publishSchedule.mutateAsync()
      toast.success(t('scheduler.schedulePublished'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleCopyPrevious() {
    const before = schedule?.assignments.length ?? 0
    try {
      const updated = await copyPreviousMonth.mutateAsync()
      const copied = updated.assignments.length - before
      toast.success(copied > 0 ? t('scheduler.copiedShifts', { count: copied }) : t('scheduler.noShiftsToCopy'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleSave() {
    try {
      await scheduleQuery.refetch()
      toast.success(t('scheduler.changesSaved'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  function confirmEnableEditing() {
    setEditingUnlocked(true)
    setConfirmEditOpen(false)
  }

  const isPublished = schedule?.status === 'PUBLISHED'
  const isEditable = Boolean(schedule) && (!isPublished || editingUnlocked)
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1

  return (
    <div>
      <PageHeader
        title={t('scheduler.title')}
        description={t('scheduler.description')}
        actions={
          schedule && (
            <div className="flex items-center gap-2">
              <Badge variant={isPublished ? 'success' : 'secondary'}>{isPublished ? t('scheduler.published') : t('scheduler.draft')}</Badge>
              {schedule.updatedByName && (
                <span className="text-xs text-muted-foreground">{t('scheduler.lastUpdatedBy', { name: schedule.updatedByName })}</span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download />
                    {t('scheduler.export.button')}
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setExportFormat('xlsx')}>{t('scheduler.export.excel')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setExportFormat('pdf')}>{t('scheduler.export.pdf')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setExportFormat('print')}>
                    <Printer />
                    {t('scheduler.export.print')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {!isPublished && (
                <>
                  <Button variant="outline" onClick={() => void handleCopyPrevious()} disabled={copyPreviousMonth.isPending}>
                    <Copy />
                    {t('scheduler.copyPreviousMonth')}
                  </Button>
                  <Button variant="outline" onClick={() => void handleSave()} disabled={scheduleQuery.isFetching}>
                    <RefreshCw />
                    {t('scheduler.save')}
                  </Button>
                  <Button onClick={() => void handlePublish()} disabled={publishSchedule.isPending}>
                    {publishSchedule.isPending ? t('scheduler.publishing') : t('scheduler.publish')}
                  </Button>
                </>
              )}
              {isPublished && !editingUnlocked && (
                <Button variant="outline" onClick={() => setConfirmEditOpen(true)}>
                  <Pencil />
                  {t('scheduler.editSchedule')}
                </Button>
              )}
              {isPublished && editingUnlocked && (
                <>
                  <Button variant="outline" onClick={() => void handleSave()} disabled={scheduleQuery.isFetching}>
                    <RefreshCw />
                    {t('scheduler.save')}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingUnlocked(false)}>
                    {t('scheduler.doneEditing')}
                  </Button>
                </>
              )}
            </div>
          )
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => goToMonth(-1)}>
              <ChevronLeft />
            </Button>
            <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
              <SelectTrigger className="w-36">
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
                {Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i).map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => goToMonth(1)}>
              <ChevronRight />
            </Button>
            <Button variant={isCurrentMonth ? 'default' : 'outline'} onClick={jumpToToday}>
              <CalendarDays />
              {t('scheduler.todayButton')}
            </Button>
          </div>

          <Input
            className="w-full max-w-xs"
            placeholder={t('scheduler.searchEmployeePlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t('common.department')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>{t('scheduler.allDepartments')}</SelectItem>
              {departmentsQuery.data?.items.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t('common.position')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>{t('scheduler.allPositions')}</SelectItem>
              {positionsQuery.data?.items.map((position) => (
                <SelectItem key={position.id} value={position.id}>
                  {position.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/*
            The trigger must always be wide enough for the longest translated
            sort label (today "Rikiuoti: darbuotojo vardas"), without a
            hardcoded width that would break on future/longer translations,
            and without resizing as the user switches options (which would
            shift the rest of the toolbar). A CSS-only technique: an
            invisible, zero-height sizer stacked in the same grid cell as the
            trigger renders all option labels at once, using the exact same
            padding/gap/icon-size box model as SelectTrigger; the grid
            column's intrinsic width is driven by the widest of those, and
            the trigger (`w-full`) fills that column.
          */}
          <div className="relative inline-grid max-w-full">
            <div aria-hidden className="invisible col-start-1 row-start-1 flex h-0 flex-col overflow-hidden">
              <span className="flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm">
                {t('scheduler.sortEmployeeName')}
                <ChevronDown className="size-4 shrink-0" />
              </span>
              <span className="flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm">
                {t('scheduler.sortDepartment')}
                <ChevronDown className="size-4 shrink-0" />
              </span>
              <span className="flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm">
                {t('scheduler.sortPosition')}
                <ChevronDown className="size-4 shrink-0" />
              </span>
            </div>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
              <SelectTrigger className="col-start-1 row-start-1 w-full min-w-0 max-w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{t('scheduler.sortEmployeeName')}</SelectItem>
                <SelectItem value="department">{t('scheduler.sortDepartment')}</SelectItem>
                <SelectItem value="position">{t('scheduler.sortPosition')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={activeOnly} onCheckedChange={setActiveOnly} id="activeOnly" />
            <Label htmlFor="activeOnly">{t('scheduler.activeOnly')}</Label>
          </div>
        </CardContent>
      </Card>

      {rosterQuery.isError && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-destructive">{getErrorMessage(rosterQuery.error)}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void rosterQuery.refetch()}>
              {t('common.tryAgain')}
            </Button>
          </CardContent>
        </Card>
      )}

      {!rosterQuery.isError && (rosterQuery.isLoading || monthQuery.isLoading) && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t('scheduler.loadingScheduler')}
        </div>
      )}

      {!rosterQuery.isError && !rosterQuery.isLoading && !monthQuery.isLoading && !scheduleSummary && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {t('scheduler.noScheduleYet', { month: monthLabels[month - 1], year })}
            </p>
            <Button className="mt-4" onClick={() => void handleCreateSchedule()} disabled={createSchedule.isPending}>
              <Plus />
              {createSchedule.isPending ? t('scheduler.creating') : t('scheduler.createDraftSchedule')}
            </Button>
          </CardContent>
        </Card>
      )}

      {!rosterQuery.isError && !rosterQuery.isLoading && !monthQuery.isLoading && scheduleSummary && (
        <>
          {scheduleQuery.isLoading || !schedule ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t('scheduler.loadingAssignments')}
            </div>
          ) : (
            <ScheduleGrid
              roster={filteredRoster}
              days={days}
              assignmentsByKey={assignmentsByKey}
              shiftTemplatesById={shiftTemplatesById}
              absenceTypesById={absenceTypesById}
              availableTemplates={availableTemplates}
              availableAbsenceTypes={availableAbsenceTypes}
              holidaysByDate={holidaysByDate}
              hoursByEmployee={hoursByEmployee}
              requiredHoursByEmploymentType={requiredHours.byType}
              disabled={!isEditable}
              locale={locale}
              onAction={handleCellAction}
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmEditOpen}
        onOpenChange={setConfirmEditOpen}
        title={t('scheduler.editPublishedTitle')}
        description={t('scheduler.editPublishedDescription')}
        confirmLabel={t('scheduler.enableEditing')}
        onConfirm={confirmEnableEditing}
      />

      {exportFormat && (
        <ScheduleExportDialog
          open={Boolean(exportFormat)}
          onOpenChange={(next) => setExportFormat(next ? exportFormat : null)}
          format={exportFormat}
          year={year}
          month={month}
        />
      )}
    </div>
  )
}
