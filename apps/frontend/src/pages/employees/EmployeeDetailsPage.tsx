import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useArchiveEmployee, useEmployee, useRestoreEmployee } from '@/hooks/useEmployees'
import { getErrorMessage } from '@/lib/errors'
import { formatLongDate } from '@/lib/date'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'
import type { EmployeeStatus, EmploymentType } from '@/types/employee.types'
import { EmployeeFormDialog } from '@/pages/employees/EmployeeFormDialog'

const STATUS_BADGE_VARIANT: Record<EmployeeStatus, 'success' | 'warning' | 'secondary'> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  ARCHIVED: 'secondary',
}

const EMPLOYEE_STATUS_KEYS: Record<EmployeeStatus, string> = {
  ACTIVE: 'common.active',
  INACTIVE: 'common.inactive',
  ARCHIVED: 'common.archived',
}

const EMPLOYMENT_TYPE_KEYS: Record<EmploymentType, string> = {
  FULL_TIME: 'employees.fullTime',
  PART_TIME_75: 'employees.partTime75',
  PART_TIME_50: 'employees.partTime50',
  PART_TIME_25: 'employees.partTime25',
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
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en' : 'lt'
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

  function formatDate(value: string | null): string {
    if (!value) return '—'
    return formatLongDate(value.slice(0, 10), locale)
  }

  async function confirmArchive() {
    if (!id) return
    try {
      await archiveEmployee.mutateAsync(id)
      toast.success(t('employees.employeeArchived'))
      setConfirmingArchive(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRestore() {
    if (!id) return
    try {
      await restoreEmployee.mutateAsync(id)
      toast.success(t('employees.employeeRestored'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  if (employeeQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t('common.loading')}
      </div>
    )
  }

  if (employeeQuery.isError || !employeeQuery.data) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-destructive">
          {employeeQuery.error ? getErrorMessage(employeeQuery.error) : t('employees.notFound')}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => void navigate('/employees')}>
          {t('employees.backToEmployees')}
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
          {t('employees.backToEmployees')}
        </Link>
      </div>

      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={employee.employeeCode}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_BADGE_VARIANT[employee.status]}>{t(EMPLOYEE_STATUS_KEYS[employee.status])}</Badge>
            {canUpdate && (
              <Button variant="outline" onClick={() => setFormOpen(true)}>
                {t('common.edit')}
              </Button>
            )}
            {canDelete && employee.status !== 'ARCHIVED' && (
              <Button variant="destructive" onClick={() => setConfirmingArchive(true)}>
                {t('common.archive')}
              </Button>
            )}
            {canDelete && employee.status === 'ARCHIVED' && (
              <Button onClick={() => void handleRestore()} disabled={restoreEmployee.isPending}>
                {restoreEmployee.isPending ? t('common.restoring') : t('common.restore')}
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('employees.detailsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label={t('employees.employeeCodeLabel')} value={employee.employeeCode} />
          <Field label={t('common.email')} value={employee.email ?? '—'} />
          <Field label={t('common.phone')} value={employee.phone ?? '—'} />
          <Field label={t('employees.employmentType')} value={t(EMPLOYMENT_TYPE_KEYS[employee.employmentType])} />
          <Field label={t('employees.department')} value={employee.departmentName ?? '—'} />
          <Field label={t('employees.position')} value={employee.positionTitle ?? '—'} />
          <Field label={t('employees.startDate')} value={formatDate(employee.startDate)} />
          <Field label={t('employees.endDate')} value={formatDate(employee.endDate)} />
          {employee.notes && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">{t('common.notes')}</p>
              <p className="mt-0.5 text-sm whitespace-pre-wrap">{employee.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <EmployeeFormDialog open={formOpen} onOpenChange={setFormOpen} employee={employee} />

      <ConfirmDialog
        open={confirmingArchive}
        onOpenChange={setConfirmingArchive}
        title={t('employees.archiveTitle')}
        description={t('employees.archiveDescription', { name: `${employee.firstName} ${employee.lastName}` })}
        confirmLabel={t('common.archive')}
        isLoading={archiveEmployee.isPending}
        onConfirm={() => void confirmArchive()}
      />
    </div>
  )
}
