import { useCallback, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Copy, Loader2, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
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
import { getErrorMessage } from '@/lib/errors'
import { ScheduleGrid } from '@/pages/scheduler/ScheduleGrid'
import type { CellActionParams } from '@/pages/scheduler/ScheduleCell'
import { cellKey, dateKey, daysInMonth } from '@/pages/scheduler/schedule-grid.utils'
import type { ScheduleAssignment } from '@/types/schedule.types'

const NONE_VALUE = '__all__'

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

type SortBy = 'name' | 'department' | 'position'

export function SchedulerPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [departmentFilter, setDepartmentFilter] = useState(NONE_VALUE)
  const [positionFilter, setPositionFilter] = useState(NONE_VALUE)
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  const [sortBy, setSortBy] = useState<SortBy>('name')

  const rosterQuery = useSchedulerRoster()
  const departmentsQuery = useDepartments({ pageSize: 100 })
  const positionsQuery = usePositions({ pageSize: 100 })

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

      if (params.shiftType === null) {
        if (params.assignmentId) {
          deleteMutate(params.assignmentId, { onError })
        }
        return
      }

      if (params.assignmentId) {
        updateMutate({ id: params.assignmentId, payload: { shiftType: params.shiftType } }, { onError })
      } else {
        createMutate(
          {
            scheduleId,
            employeeId: params.employeeId,
            contractId: params.contractId,
            date: params.date,
            shiftType: params.shiftType,
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

  const filteredRoster = useMemo(() => {
    let list = rosterQuery.data ?? []
    if (activeOnly) {
      list = list.filter((entry) => entry.employee.status === 'ACTIVE')
    }
    if (departmentFilter !== NONE_VALUE) {
      list = list.filter((entry) => entry.contract?.departmentId === departmentFilter)
    }
    if (positionFilter !== NONE_VALUE) {
      list = list.filter((entry) => entry.contract?.positionId === positionFilter)
    }
    if (search.trim()) {
      const query = search.trim().toLowerCase()
      list = list.filter((entry) =>
        `${entry.employee.firstName} ${entry.employee.lastName}`.toLowerCase().includes(query),
      )
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'department') {
        return (a.contract?.departmentName ?? '').localeCompare(b.contract?.departmentName ?? '')
      }
      if (sortBy === 'position') {
        return (a.contract?.positionTitle ?? '').localeCompare(b.contract?.positionTitle ?? '')
      }
      return `${a.employee.firstName} ${a.employee.lastName}`.localeCompare(
        `${b.employee.firstName} ${b.employee.lastName}`,
      )
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
      toast.success('Draft schedule created')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handlePublish() {
    try {
      await publishSchedule.mutateAsync()
      toast.success('Schedule published — it is now read-only')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleCopyPrevious() {
    const before = schedule?.assignments.length ?? 0
    try {
      const updated = await copyPreviousMonth.mutateAsync()
      const copied = updated.assignments.length - before
      toast.success(copied > 0 ? `Copied ${copied} shift(s) from last month` : 'No shifts found in the previous month')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleSave() {
    try {
      await scheduleQuery.refetch()
      toast.success('All changes saved')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const isPublished = schedule?.status === 'PUBLISHED'

  return (
    <div>
      <PageHeader
        title="Monthly scheduler"
        description="Build and publish your team's monthly work schedule."
        actions={
          schedule && (
            <div className="flex items-center gap-2">
              <Badge variant={isPublished ? 'success' : 'secondary'}>{isPublished ? 'Published' : 'Draft'}</Badge>
              {!isPublished && (
                <>
                  <Button variant="outline" onClick={() => void handleCopyPrevious()} disabled={copyPreviousMonth.isPending}>
                    <Copy />
                    Copy previous month
                  </Button>
                  <Button variant="outline" onClick={() => void handleSave()} disabled={scheduleQuery.isFetching}>
                    <RefreshCw />
                    Save
                  </Button>
                  <Button onClick={() => void handlePublish()} disabled={publishSchedule.isPending}>
                    {publishSchedule.isPending ? 'Publishing…' : 'Publish'}
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
                {MONTH_LABELS.map((label, index) => (
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
            <Button variant="outline" onClick={jumpToToday}>
              <CalendarDays />
              Today
            </Button>
          </div>

          <Input
            className="w-full max-w-xs"
            placeholder="Search employee…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>All departments</SelectItem>
              {departmentsQuery.data?.items.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>All positions</SelectItem>
              {positionsQuery.data?.items.map((position) => (
                <SelectItem key={position.id} value={position.id}>
                  {position.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort: Employee name</SelectItem>
              <SelectItem value="department">Sort: Department</SelectItem>
              <SelectItem value="position">Sort: Position</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch checked={activeOnly} onCheckedChange={setActiveOnly} id="activeOnly" />
            <Label htmlFor="activeOnly">Active only</Label>
          </div>
        </CardContent>
      </Card>

      {rosterQuery.isError && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-destructive">{getErrorMessage(rosterQuery.error)}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void rosterQuery.refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {!rosterQuery.isError && (rosterQuery.isLoading || monthQuery.isLoading) && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading scheduler…
        </div>
      )}

      {!rosterQuery.isError && !rosterQuery.isLoading && !monthQuery.isLoading && !scheduleSummary && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No schedule yet for {MONTH_LABELS[month - 1]} {year}.
            </p>
            <Button className="mt-4" onClick={() => void handleCreateSchedule()} disabled={createSchedule.isPending}>
              <Plus />
              {createSchedule.isPending ? 'Creating…' : 'Create draft schedule'}
            </Button>
          </CardContent>
        </Card>
      )}

      {!rosterQuery.isError && !rosterQuery.isLoading && !monthQuery.isLoading && scheduleSummary && (
        <>
          {scheduleQuery.isLoading || !schedule ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading assignments…
            </div>
          ) : (
            <ScheduleGrid
              roster={filteredRoster}
              days={days}
              assignmentsByKey={assignmentsByKey}
              disabled={isPublished ?? false}
              onAction={handleCellAction}
            />
          )}
        </>
      )}
    </div>
  )
}
