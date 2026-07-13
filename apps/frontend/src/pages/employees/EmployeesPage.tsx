import { Loader2, MoreHorizontal, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PaginationBar } from '@/components/shared/PaginationBar'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmployeeFormDialog } from '@/pages/employees/EmployeeFormDialog'
import { useDepartments } from '@/hooks/useDepartments'
import { useArchiveEmployee, useEmployees, useRestoreEmployee } from '@/hooks/useEmployees'
import { usePositions } from '@/hooks/usePositions'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'
import type { Employee, EmployeeSortBy, EmployeeStatus } from '@/types/employee.types'

const NONE_VALUE = '__all__'

const STATUS_BADGE_VARIANT: Record<EmployeeStatus, 'success' | 'warning' | 'secondary'> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  ARCHIVED: 'secondary',
}

const STATUS_FILTER_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ARCHIVED', label: 'Archived' },
]

interface SortOption {
  value: string
  sortBy: EmployeeSortBy
  sortOrder: 'asc' | 'desc'
  label: string
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'name-asc', sortBy: 'name', sortOrder: 'asc', label: 'Name (A–Z)' },
  { value: 'name-desc', sortBy: 'name', sortOrder: 'desc', label: 'Name (Z–A)' },
  { value: 'hireDate-desc', sortBy: 'hireDate', sortOrder: 'desc', label: 'Hire date (newest)' },
  { value: 'hireDate-asc', sortBy: 'hireDate', sortOrder: 'asc', label: 'Hire date (oldest)' },
  { value: 'createdAt-desc', sortBy: 'createdAt', sortOrder: 'desc', label: 'Recently added' },
  { value: 'createdAt-asc', sortBy: 'createdAt', sortOrder: 'asc', label: 'Oldest added' },
]

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

export function EmployeesPage() {
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const canCreate = hasAnyPermission([PERMISSIONS.EMPLOYEE_CREATE])
  const canUpdate = hasAnyPermission([PERMISSIONS.EMPLOYEE_UPDATE])
  const canDelete = hasAnyPermission([PERMISSIONS.EMPLOYEE_DELETE])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState(NONE_VALUE)
  const [positionFilter, setPositionFilter] = useState(NONE_VALUE)
  const [statusFilter, setStatusFilter] = useState(NONE_VALUE)
  const [sort, setSort] = useState('name-asc')
  const [formOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined)
  const [archivingEmployee, setArchivingEmployee] = useState<Employee | undefined>(undefined)

  const activeSort = SORT_OPTIONS.find((option) => option.value === sort) ?? SORT_OPTIONS[0]

  const departmentsQuery = useDepartments({ pageSize: 100 })
  const positionsQuery = usePositions({ pageSize: 100 })

  const employeesQuery = useEmployees({
    page,
    pageSize: 20,
    search: search || undefined,
    departmentId: departmentFilter === NONE_VALUE ? undefined : departmentFilter,
    positionId: positionFilter === NONE_VALUE ? undefined : positionFilter,
    status: statusFilter === NONE_VALUE ? undefined : (statusFilter as EmployeeStatus),
    sortBy: activeSort.sortBy,
    sortOrder: activeSort.sortOrder,
  })
  const archiveEmployee = useArchiveEmployee()
  const restoreEmployee = useRestoreEmployee()

  function openCreateDialog() {
    setEditingEmployee(undefined)
    setFormOpen(true)
  }

  function openEditDialog(employee: Employee) {
    setEditingEmployee(employee)
    setFormOpen(true)
  }

  function resetToFirstPage() {
    setPage(1)
  }

  async function confirmArchive() {
    if (!archivingEmployee) return
    try {
      await archiveEmployee.mutateAsync(archivingEmployee.id)
      toast.success('Employee archived')
      setArchivingEmployee(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRestore(employee: Employee) {
    try {
      await restoreEmployee.mutateAsync(employee.id)
      toast.success('Employee restored')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const employees = employeesQuery.data?.items ?? []

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage your workforce records."
        actions={
          canCreate && (
            <Button onClick={openCreateDialog}>
              <Plus />
              New employee
            </Button>
          )
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, email, phone, personal code…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  resetToFirstPage()
                }}
              />
            </div>

            <Select
              value={departmentFilter}
              onValueChange={(value) => {
                setDepartmentFilter(value)
                resetToFirstPage()
              }}
            >
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

            <Select
              value={positionFilter}
              onValueChange={(value) => {
                setPositionFilter(value)
                resetToFirstPage()
              }}
            >
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

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                resetToFirstPage()
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>All statuses</SelectItem>
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Hire date</TableHead>
                <TableHead>Status</TableHead>
                {(canUpdate || canDelete) && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeesQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading employees…
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {employeesQuery.isError && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    <p className="text-sm text-destructive">{getErrorMessage(employeesQuery.error)}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => void employeesQuery.refetch()}
                    >
                      Try again
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!employeesQuery.isLoading && !employeesQuery.isError && employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    {search || departmentFilter !== NONE_VALUE || positionFilter !== NONE_VALUE || statusFilter !== NONE_VALUE
                      ? 'No employees match your filters.'
                      : 'No employees yet. Add your first employee to get started.'}
                  </TableCell>
                </TableRow>
              )}

              {!employeesQuery.isLoading &&
                !employeesQuery.isError &&
                employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="text-muted-foreground">{employee.employeeCode}</TableCell>
                    <TableCell className="font-medium">
                      <Link to={`/employees/${employee.id}`} className="hover:underline">
                        {employee.firstName} {employee.lastName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{employee.departmentName ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{employee.positionTitle ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(employee.hireDate)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[employee.status]}>
                        {employee.status.charAt(0) + employee.status.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    {(canUpdate || canDelete) && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/employees/${employee.id}`}>View details</Link>
                            </DropdownMenuItem>
                            {canUpdate && (
                              <DropdownMenuItem onClick={() => openEditDialog(employee)}>Edit</DropdownMenuItem>
                            )}
                            {canDelete && employee.status !== 'ARCHIVED' && (
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setArchivingEmployee(employee)}
                              >
                                Archive
                              </DropdownMenuItem>
                            )}
                            {canDelete && employee.status === 'ARCHIVED' && (
                              <DropdownMenuItem onClick={() => void handleRestore(employee)}>
                                Restore
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {employeesQuery.data && <PaginationBar meta={employeesQuery.data.meta} onPageChange={setPage} />}
        </CardContent>
      </Card>

      <EmployeeFormDialog open={formOpen} onOpenChange={setFormOpen} employee={editingEmployee} />

      <ConfirmDialog
        open={Boolean(archivingEmployee)}
        onOpenChange={(open) => !open && setArchivingEmployee(undefined)}
        title="Archive employee"
        description={`Are you sure you want to archive "${archivingEmployee?.firstName} ${archivingEmployee?.lastName}"? They will be hidden from the default list but can be restored at any time.`}
        confirmLabel="Archive"
        isLoading={archiveEmployee.isPending}
        onConfirm={() => void confirmArchive()}
      />
    </div>
  )
}
