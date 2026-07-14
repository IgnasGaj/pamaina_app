import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useArchiveEmployee, useEmployee, useRestoreEmployee } from '@/hooks/useEmployees'
import { useEmployeeContracts } from '@/hooks/useContracts'
import { getErrorMessage } from '@/lib/errors'
import { CONTRACT_STATUS_BADGE_VARIANT, CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS, WORK_WEEK_LABELS } from '@/lib/contract-options'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'
import type { EmployeeStatus } from '@/types/employee.types'
import type { EmploymentContract } from '@/types/contract.types'
import { EmployeeFormDialog } from '@/pages/employees/EmployeeFormDialog'
import { ContractFormDialog } from '@/pages/contracts/ContractFormDialog'
import { EndContractDialog } from '@/pages/contracts/EndContractDialog'
import { ContractHistoryTimeline } from '@/pages/contracts/ContractHistoryTimeline'

const STATUS_BADGE_VARIANT: Record<EmployeeStatus, 'success' | 'warning' | 'secondary'> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  ARCHIVED: 'secondary',
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
  const canCreateContract = hasAnyPermission([PERMISSIONS.CONTRACT_CREATE])
  const canUpdateContract = hasAnyPermission([PERMISSIONS.CONTRACT_UPDATE])

  const [formOpen, setFormOpen] = useState(false)
  const [confirmingArchive, setConfirmingArchive] = useState(false)
  const [contractFormOpen, setContractFormOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<EmploymentContract | undefined>(undefined)
  const [endingContract, setEndingContract] = useState<EmploymentContract | undefined>(undefined)

  const employeeQuery = useEmployee(id)
  const archiveEmployee = useArchiveEmployee()
  const restoreEmployee = useRestoreEmployee()
  const contractsQuery = useEmployeeContracts(id)

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
  const contracts = contractsQuery.data ?? []
  const activeContract = contracts.find((contract) => contract.status === 'ACTIVE')
  const previousContracts = contracts.filter((contract) => contract.id !== activeContract?.id)

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Employee code" value={employee.employeeCode} />
            <Field label="Email" value={employee.email ?? '—'} />
            <Field label="Phone" value={employee.phone ?? '—'} />
            <Field label="Personal code" value={employee.personalCode ?? '—'} />
            <Field label="Birth date" value={formatDate(employee.birthDate)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Current active contract</CardTitle>
            {canCreateContract && (
              <Button size="sm" variant="outline" onClick={() => { setEditingContract(undefined); setContractFormOpen(true) }}>
                <Plus />
                New contract
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {contractsQuery.isLoading && (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading contracts…
              </div>
            )}
            {!contractsQuery.isLoading && !activeContract && (
              <p className="py-4 text-sm text-muted-foreground">No active contract.</p>
            )}
            {activeContract && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{activeContract.contractNumber}</span>
                    <Badge variant={CONTRACT_STATUS_BADGE_VARIANT[activeContract.status]}>
                      {CONTRACT_STATUS_LABELS[activeContract.status]}
                    </Badge>
                  </div>
                  {canUpdateContract && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingContract(activeContract)
                          setContractFormOpen(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setEndingContract(activeContract)}>
                        End
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Contract type" value={CONTRACT_TYPE_LABELS[activeContract.contractType]} />
                  <Field label="Department" value={activeContract.departmentName ?? '—'} />
                  <Field label="Position" value={activeContract.positionTitle ?? '—'} />
                  <Field label="Start date" value={formatDate(activeContract.startDate)} />
                  <Field label="Weekly hours" value={String(activeContract.weeklyHours)} />
                  <Field label="FTE" value={String(activeContract.fte)} />
                  <Field label="Work week" value={WORK_WEEK_LABELS[activeContract.workWeek]} />
                  <Field label="Vacation days/year" value={String(activeContract.vacationDaysPerYear)} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Previous contracts</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractHistoryTimeline contracts={previousContracts} />
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

      {id && (
        <ContractFormDialog
          open={contractFormOpen}
          onOpenChange={setContractFormOpen}
          contract={editingContract}
          employeeId={id}
        />
      )}

      <EndContractDialog
        open={Boolean(endingContract)}
        onOpenChange={(open) => !open && setEndingContract(undefined)}
        contract={endingContract}
      />
    </div>
  )
}
