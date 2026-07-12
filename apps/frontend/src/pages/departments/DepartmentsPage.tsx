import { MoreHorizontal, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { PaginationBar } from '@/components/shared/PaginationBar'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDeleteDepartment, useDepartments } from '@/hooks/useDepartments'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'
import type { Department } from '@/types/department.types'
import { DepartmentFormDialog } from '@/pages/departments/DepartmentFormDialog'

export function DepartmentsPage() {
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const canCreate = hasAnyPermission([PERMISSIONS.DEPARTMENT_CREATE])
  const canUpdate = hasAnyPermission([PERMISSIONS.DEPARTMENT_UPDATE])
  const canDelete = hasAnyPermission([PERMISSIONS.DEPARTMENT_DELETE])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | undefined>(undefined)
  const [deletingDepartment, setDeletingDepartment] = useState<Department | undefined>(undefined)

  const departmentsQuery = useDepartments({ page, pageSize: 10, search: search || undefined })
  const deleteDepartment = useDeleteDepartment()

  function openCreateDialog() {
    setEditingDepartment(undefined)
    setFormOpen(true)
  }

  function openEditDialog(department: Department) {
    setEditingDepartment(department)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deletingDepartment) return
    try {
      await deleteDepartment.mutateAsync(deletingDepartment.id)
      toast.success('Department deleted')
      setDeletingDepartment(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Organize your company into departments."
        actions={
          canCreate && (
            <Button onClick={openCreateDialog}>
              <Plus />
              New department
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
              placeholder="Search departments…"
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
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Status</TableHead>
                {(canUpdate || canDelete) && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentsQuery.data?.items.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {department.description ?? '—'}
                  </TableCell>
                  <TableCell>{department.employeeCount}</TableCell>
                  <TableCell>
                    <Badge variant={department.isActive ? 'success' : 'secondary'}>
                      {department.isActive ? 'Active' : 'Inactive'}
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
                          {canDelete && (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeletingDepartment(department)}
                            >
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {departmentsQuery.data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No departments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {departmentsQuery.data && (
            <PaginationBar meta={departmentsQuery.data.meta} onPageChange={setPage} />
          )}
        </CardContent>
      </Card>

      <DepartmentFormDialog open={formOpen} onOpenChange={setFormOpen} department={editingDepartment} />

      <ConfirmDialog
        open={Boolean(deletingDepartment)}
        onOpenChange={(open) => !open && setDeletingDepartment(undefined)}
        title="Delete department"
        description={`Are you sure you want to delete "${deletingDepartment?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteDepartment.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
