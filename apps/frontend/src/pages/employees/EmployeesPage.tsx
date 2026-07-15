import { Loader2, MoreHorizontal, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

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
import { useArchiveEmployee, useEmployees, useRestoreEmployee } from '@/hooks/useEmployees'
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

const EMPLOYEE_STATUS_LABEL_KEYS: Record<EmployeeStatus, string> = {
  ACTIVE: 'common.active',
  INACTIVE: 'common.inactive',
  ARCHIVED: 'common.archived',
}

interface SortOption {
  value: string
  sortBy: EmployeeSortBy
  sortOrder: 'asc' | 'desc'
  label: string
}

export function EmployeesPage() {
  const { t } = useTranslation()
  const STATUS_FILTER_OPTIONS: { value: EmployeeStatus; label: string }[] = [
    { value: 'ACTIVE', label: t('common.active') },
    { value: 'INACTIVE', label: t('common.inactive') },
    { value: 'ARCHIVED', label: t('common.archived') },
  ]
  const SORT_OPTIONS: SortOption[] = [
    { value: 'name-asc', sortBy: 'name', sortOrder: 'asc', label: t('common.nameAZ') },
    { value: 'name-desc', sortBy: 'name', sortOrder: 'desc', label: t('common.nameZA') },
    { value: 'createdAt-desc', sortBy: 'createdAt', sortOrder: 'desc', label: t('common.recentlyAdded') },
    { value: 'createdAt-asc', sortBy: 'createdAt', sortOrder: 'asc', label: t('common.oldestAdded') },
  ]
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const canCreate = hasAnyPermission([PERMISSIONS.EMPLOYEE_CREATE])
  const canUpdate = hasAnyPermission([PERMISSIONS.EMPLOYEE_UPDATE])
  const canDelete = hasAnyPermission([PERMISSIONS.EMPLOYEE_DELETE])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(NONE_VALUE)
  const [sort, setSort] = useState('name-asc')
  const [formOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined)
  const [archivingEmployee, setArchivingEmployee] = useState<Employee | undefined>(undefined)

  const activeSort = SORT_OPTIONS.find((option) => option.value === sort) ?? SORT_OPTIONS[0]

  const employeesQuery = useEmployees({
    page,
    pageSize: 20,
    search: search || undefined,
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
      toast.success(t('employees.employeeArchived'))
      setArchivingEmployee(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRestore(employee: Employee) {
    try {
      await restoreEmployee.mutateAsync(employee.id)
      toast.success(t('employees.employeeRestored'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const employees = employeesQuery.data?.items ?? []

  return (
    <div>
      <PageHeader
        title={t('employees.title')}
        description={t('employees.description')}
        actions={
          canCreate && (
            <Button onClick={openCreateDialog}>
              <Plus />
              {t('employees.newEmployee')}
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
                placeholder={t('employees.searchPlaceholder')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  resetToFirstPage()
                }}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                resetToFirstPage()
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>{t('common.allStatuses')}</SelectItem>
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('common.sortBy')} />
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
                <TableHead>{t('common.code')}</TableHead>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('common.department')}</TableHead>
                <TableHead>{t('common.position')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                {(canUpdate || canDelete) && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeesQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      {t('employees.loadingEmployees')}
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {employeesQuery.isError && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <p className="text-sm text-destructive">{getErrorMessage(employeesQuery.error)}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => void employeesQuery.refetch()}
                    >
                      {t('common.tryAgain')}
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!employeesQuery.isLoading && !employeesQuery.isError && employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {search || statusFilter !== NONE_VALUE ? t('employees.noMatch') : t('employees.noneYet')}
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
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[employee.status]}>
                        {EMPLOYEE_STATUS_LABEL_KEYS[employee.status] ? t(EMPLOYEE_STATUS_LABEL_KEYS[employee.status]) : employee.status}
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
                              <Link to={`/employees/${employee.id}`}>{t('common.viewDetails')}</Link>
                            </DropdownMenuItem>
                            {canUpdate && (
                              <DropdownMenuItem onClick={() => openEditDialog(employee)}>{t('common.edit')}</DropdownMenuItem>
                            )}
                            {canDelete && employee.status !== 'ARCHIVED' && (
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setArchivingEmployee(employee)}
                              >
                                {t('common.archive')}
                              </DropdownMenuItem>
                            )}
                            {canDelete && employee.status === 'ARCHIVED' && (
                              <DropdownMenuItem onClick={() => void handleRestore(employee)}>
                                {t('common.restore')}
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
        title={t('employees.archiveTitle')}
        description={t('employees.archiveDescription', {
          name: `${archivingEmployee?.firstName} ${archivingEmployee?.lastName}`,
        })}
        confirmLabel={t('common.archive')}
        isLoading={archiveEmployee.isPending}
        onConfirm={() => void confirmArchive()}
      />
    </div>
  )
}
