import { MoreHorizontal, Plus, Search } from 'lucide-react'
import { useState } from 'react'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmployeeFormDialog } from '@/pages/employees/EmployeeFormDialog'
import { useDeleteEmployee, useEmployees } from '@/hooks/useEmployees'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'
import type { Employee, EmploymentStatus } from '@/types/employee.types'

const STATUS_BADGE_VARIANT: Record<EmploymentStatus, 'success' | 'warning' | 'secondary'> = {
  ACTIVE: 'success',
  ON_LEAVE: 'warning',
  TERMINATED: 'secondary',
}

export function EmployeesPage() {
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const canCreate = hasAnyPermission([PERMISSIONS.EMPLOYEE_CREATE])
  const canUpdate = hasAnyPermission([PERMISSIONS.EMPLOYEE_UPDATE])
  const canDelete = hasAnyPermission([PERMISSIONS.EMPLOYEE_DELETE])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | undefined>(undefined)

  const employeesQuery = useEmployees({ page, pageSize: 10, search: search || undefined })
  const deleteEmployee = useDeleteEmployee()

  function openCreateDialog() {
    setEditingEmployee(undefined)
    setFormOpen(true)
  }

  function openEditDialog(employee: Employee) {
    setEditingEmployee(employee)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deletingEmployee) return
    try {
      await deleteEmployee.mutateAsync(deletingEmployee.id)
      toast.success('Employee deleted')
      setDeletingEmployee(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

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
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search employees…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                {(canUpdate || canDelete) && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeesQuery.data?.items.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="text-muted-foreground">{employee.employeeCode}</TableCell>
                  <TableCell className="font-medium">
                    {employee.firstName} {employee.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{employee.departmentName ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{employee.positionTitle ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.employmentType.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[employee.employmentStatus]}>
                      {employee.employmentStatus.replace('_', ' ')}
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
                            <DropdownMenuItem onClick={() => openEditDialog(employee)}>Edit</DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem variant="destructive" onClick={() => setDeletingEmployee(employee)}>
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {employeesQuery.data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No employees found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {employeesQuery.data && <PaginationBar meta={employeesQuery.data.meta} onPageChange={setPage} />}
        </CardContent>
      </Card>

      <EmployeeFormDialog open={formOpen} onOpenChange={setFormOpen} employee={editingEmployee} />

      <ConfirmDialog
        open={Boolean(deletingEmployee)}
        onOpenChange={(open) => !open && setDeletingEmployee(undefined)}
        title="Delete employee"
        description={`Are you sure you want to delete "${deletingEmployee?.firstName} ${deletingEmployee?.lastName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteEmployee.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
