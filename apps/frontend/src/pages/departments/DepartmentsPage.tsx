import { Loader2, MoreHorizontal, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PaginationBar } from '@/components/shared/PaginationBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useArchiveDepartment, useDepartments, useRestoreDepartment } from '@/hooks/useDepartments'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'
import type { Department, DepartmentSortBy, DepartmentStatusFilter } from '@/types/department.types'
import { DepartmentFormDialog } from '@/pages/departments/DepartmentFormDialog'

const NONE_VALUE = '__all__'

interface SortOption {
  value: string
  sortBy: DepartmentSortBy
  sortOrder: 'asc' | 'desc'
  label: string
}

export function DepartmentsPage() {
  const { t } = useTranslation()
  const SORT_OPTIONS: SortOption[] = [
    { value: 'name-asc', sortBy: 'name', sortOrder: 'asc', label: t('common.nameAZ') },
    { value: 'name-desc', sortBy: 'name', sortOrder: 'desc', label: t('common.nameZA') },
    { value: 'createdAt-desc', sortBy: 'createdAt', sortOrder: 'desc', label: t('common.recentlyCreated') },
    { value: 'createdAt-asc', sortBy: 'createdAt', sortOrder: 'asc', label: t('common.oldestCreated') },
    { value: 'employeeCount-desc', sortBy: 'employeeCount', sortOrder: 'desc', label: t('common.mostEmployees') },
    { value: 'employeeCount-asc', sortBy: 'employeeCount', sortOrder: 'asc', label: t('common.fewestEmployees') },
  ]
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const canCreate = hasAnyPermission([PERMISSIONS.DEPARTMENT_CREATE])
  const canUpdate = hasAnyPermission([PERMISSIONS.DEPARTMENT_UPDATE])
  const canDelete = hasAnyPermission([PERMISSIONS.DEPARTMENT_DELETE])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(NONE_VALUE)
  const [sort, setSort] = useState('name-asc')
  const [formOpen, setFormOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | undefined>(undefined)
  const [archivingDepartment, setArchivingDepartment] = useState<Department | undefined>(undefined)

  const activeSort = SORT_OPTIONS.find((option) => option.value === sort) ?? SORT_OPTIONS[0]

  const departmentsQuery = useDepartments({
    page,
    pageSize: 20,
    search: search || undefined,
    status: statusFilter === NONE_VALUE ? undefined : (statusFilter as DepartmentStatusFilter),
    sortBy: activeSort.sortBy,
    sortOrder: activeSort.sortOrder,
  })
  const archiveDepartment = useArchiveDepartment()
  const restoreDepartment = useRestoreDepartment()

  function openCreateDialog() {
    setEditingDepartment(undefined)
    setFormOpen(true)
  }

  function openEditDialog(department: Department) {
    setEditingDepartment(department)
    setFormOpen(true)
  }

  function resetToFirstPage() {
    setPage(1)
  }

  async function confirmArchive() {
    if (!archivingDepartment) return
    try {
      await archiveDepartment.mutateAsync(archivingDepartment.id)
      toast.success(t('departments.archived'))
      setArchivingDepartment(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRestore(department: Department) {
    try {
      await restoreDepartment.mutateAsync(department.id)
      toast.success(t('departments.restored'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const departments = departmentsQuery.data?.items ?? []

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('departments.searchPlaceholder')}
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
            <SelectItem value="ACTIVE">{t('common.active')}</SelectItem>
            <SelectItem value="ARCHIVED">{t('common.archived')}</SelectItem>
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

        {canCreate && (
          <Button className="ml-auto" onClick={openCreateDialog}>
            <Plus />
            {t('departments.newDepartment')}
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('common.name')}</TableHead>
            <TableHead>{t('common.description')}</TableHead>
            <TableHead>{t('common.employees')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            {(canUpdate || canDelete) && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {departmentsQuery.isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {t('departments.loadingDepartments')}
                </div>
              </TableCell>
            </TableRow>
          )}

          {departmentsQuery.isError && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center">
                <p className="text-sm text-destructive">{getErrorMessage(departmentsQuery.error)}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => void departmentsQuery.refetch()}>
                  {t('common.tryAgain')}
                </Button>
              </TableCell>
            </TableRow>
          )}

          {!departmentsQuery.isLoading && !departmentsQuery.isError && departments.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                {search || statusFilter !== NONE_VALUE ? t('departments.noMatch') : t('departments.noneYet')}
              </TableCell>
            </TableRow>
          )}

          {!departmentsQuery.isLoading &&
            !departmentsQuery.isError &&
            departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: department.color }}
                      aria-hidden
                    />
                    {department.name}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {department.description ?? '—'}
                </TableCell>
                <TableCell>{department.employeeCount}</TableCell>
                <TableCell>
                  <Badge variant={department.isArchived ? 'secondary' : department.isActive ? 'success' : 'warning'}>
                    {department.isArchived ? t('common.archived') : department.isActive ? t('common.active') : t('common.inactive')}
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
                        {canUpdate && (
                          <DropdownMenuItem onClick={() => openEditDialog(department)}>{t('common.edit')}</DropdownMenuItem>
                        )}
                        {canDelete && !department.isArchived && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setArchivingDepartment(department)}
                          >
                            {t('common.archive')}
                          </DropdownMenuItem>
                        )}
                        {canDelete && department.isArchived && (
                          <DropdownMenuItem onClick={() => void handleRestore(department)}>
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

      {departmentsQuery.data && <PaginationBar meta={departmentsQuery.data.meta} onPageChange={setPage} />}

      <DepartmentFormDialog open={formOpen} onOpenChange={setFormOpen} department={editingDepartment} />

      <ConfirmDialog
        open={Boolean(archivingDepartment)}
        onOpenChange={(open) => !open && setArchivingDepartment(undefined)}
        title={t('departments.archiveTitle')}
        description={t('departments.archiveDescription', { name: archivingDepartment?.name })}
        confirmLabel={t('common.archive')}
        isLoading={archiveDepartment.isPending}
        onConfirm={() => void confirmArchive()}
      />
    </div>
  )
}
