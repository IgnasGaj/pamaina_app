import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useArchiveEmployee, useEmployee, useRestoreEmployee } from '@/hooks/useEmployees'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'
import type { EmployeeStatus, EmploymentType } from '@/types/employee.types'
import { EmployeeFormDialog } from '@/pages/employees/EmployeeFormDialog'

const STATUS_BADGE_VARIANT: Record<EmployeeStatus, 'success' | 'warning' | 'secondary'> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  ARCHIVED: 'secondary',
}

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  )
}

export function EmployeeDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const canUpdate = hasAnyPermission([PERMISSIONS.EMPLOYEE_UPDATE])
  const canDelete = hasAnyPermission([PERMISSIONS.EMPLOYEE_DELETE])

  const [formOpen, setFormOpen] = useState(false)
  const [confirmingArchive, setConfirmingArchive] = useState(false)

  const employeeQuery = useEmployee(id)
  const archiveEmployee = useArchiveEmployee()
  const restoreEmployee = useRestoreEmployee()

  async function confirmArchive() {
    if (!id) return
    try {
      await archiveEmployee.mutateAsync(id)
      toast.success('Employee archived')
      setConfirmingArchive(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRestore() {
    if (!id) return
    try {
      await restoreEmployee.mutateAsync(id)
      toast.success('Employee restored')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  if (employeeQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading employee…
      </div>
    )
  }

  if (employeeQuery.isError || !employeeQuery.data) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-destructive">
          {employeeQuery.error ? getErrorMessage(employeeQuery.error) : 'Employee not found.'}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => void navigate('/employees')}>
          Back to employees
        </Button>
      </div>
    )
  }

  const employee = employeeQuery.data

  return (
    <div>
      <div className="mb-2">
        <Link
          to="/employees"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to employees
        </Link>
      </div>

      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={employee.employeeCode}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_BADGE_VARIANT[employee.status]}>
              {employee.status.charAt(0) + employee.status.slice(1).toLowerCase()}
            </Badge>
            {canUpdate && (
              <Button variant="outline" onClick={() => setFormOpen(true)}>
                Edit
              </Button>
            )}
            {canDelete && employee.status !== 'ARCHIVED' && (
              <Button variant="destructive" onClick={() => setConfirmingArchive(true)}>
                Archive
              </Button>
            )}
            {canDelete && employee.status === 'ARCHIVED' && (
              <Button onClick={() => void handleRestore()} disabled={restoreEmployee.isPending}>
                {restoreEmployee.isPending ? 'Restoring…' : 'Restore'}
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employee details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Employee code" value={employee.employeeCode} />
          <Field label="Email" value={employee.email ?? '—'} />
          <Field label="Phone" value={employee.phone ?? '—'} />
          <Field label="Employment type" value={EMPLOYMENT_TYPE_LABELS[employee.employmentType]} />
          <Field label="Department" value={employee.departmentName ?? '—'} />
          <Field label="Position" value={employee.positionTitle ?? '—'} />
          <Field label="Start date" value={formatDate(employee.startDate)} />
          <Field label="End date" value={formatDate(employee.endDate)} />
          {employee.notes && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="mt-0.5 text-sm whitespace-pre-wrap">{employee.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <EmployeeFormDialog open={formOpen} onOpenChange={setFormOpen} employee={employee} />

      <ConfirmDialog
        open={confirmingArchive}
        onOpenChange={setConfirmingArchive}
        title="Archive employee"
        description={`Are you sure you want to archive "${employee.firstName} ${employee.lastName}"? They will be hidden from the default list but can be restored at any time.`}
        confirmLabel="Archive"
        isLoading={archiveEmployee.isPending}
        onConfirm={() => void confirmArchive()}
      />
    </div>
  )
}
