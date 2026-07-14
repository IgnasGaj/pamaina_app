import { Loader2, MoreHorizontal, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

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

const SORT_OPTIONS: SortOption[] = [
  { value: 'name-asc', sortBy: 'name', sortOrder: 'asc', label: 'Name (A–Z)' },
  { value: 'name-desc', sortBy: 'name', sortOrder: 'desc', label: 'Name (Z–A)' },
  { value: 'createdAt-desc', sortBy: 'createdAt', sortOrder: 'desc', label: 'Recently created' },
  { value: 'createdAt-asc', sortBy: 'createdAt', sortOrder: 'asc', label: 'Oldest created' },
  { value: 'employeeCount-desc', sortBy: 'employeeCount', sortOrder: 'desc', label: 'Most employees' },
  { value: 'employeeCount-asc', sortBy: 'employeeCount', sortOrder: 'asc', label: 'Fewest employees' },
]

export function DepartmentsPage() {
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
      toast.success('Department archived')
      setArchivingDepartment(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRestore(department: Department) {
    try {
      await restoreDepartment.mutateAsync(department.id)
      toast.success('Department restored')
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
            placeholder="Search departments…"
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
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
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

        {canCreate && (
          <Button className="ml-auto" onClick={openCreateDialog}>
            <Plus />
            New department
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Employees</TableHead>
            <TableHead>Status</TableHead>
            {(canUpdate || canDelete) && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {departmentsQuery.isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Loading departments…
                </div>
              </TableCell>
            </TableRow>
          )}

          {departmentsQuery.isError && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center">
                <p className="text-sm text-destructive">{getErrorMessage(departmentsQuery.error)}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => void departmentsQuery.refetch()}>
                  Try again
                </Button>
              </TableCell>
            </TableRow>
          )}

          {!departmentsQuery.isLoading && !departmentsQuery.isError && departments.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                {search || statusFilter !== NONE_VALUE
                  ? 'No departments match your filters.'
                  : 'No departments yet. Add your first department to get started.'}
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
                    {department.isArchived ? 'Archived' : department.isActive ? 'Active' : 'Inactive'}
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
                          <DropdownMenuItem onClick={() => openEditDialog(department)}>Edit</DropdownMenuItem>
                        )}
                        {canDelete && !department.isArchived && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setArchivingDepartment(department)}
                          >
                            Archive
                          </DropdownMenuItem>
                        )}
                        {canDelete && department.isArchived && (
                          <DropdownMenuItem onClick={() => void handleRestore(department)}>
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

      {departmentsQuery.data && <PaginationBar meta={departmentsQuery.data.meta} onPageChange={setPage} />}

      <DepartmentFormDialog open={formOpen} onOpenChange={setFormOpen} department={editingDepartment} />

      <ConfirmDialog
        open={Boolean(archivingDepartment)}
        onOpenChange={(open) => !open && setArchivingDepartment(undefined)}
        title="Archive department"
        description={`Are you sure you want to archive "${archivingDepartment?.name}"? It will be hidden from the default list but can be restored at any time.`}
        confirmLabel="Archive"
        isLoading={archiveDepartment.isPending}
        onConfirm={() => void confirmArchive()}
      />
    </div>
  )
}
