import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useContract } from '@/hooks/useContracts'
import { getErrorMessage } from '@/lib/errors'
import { CONTRACT_STATUS_BADGE_VARIANT, CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS, WORK_WEEK_LABELS } from '@/lib/contract-options'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'
import { ContractFormDialog } from '@/pages/contracts/ContractFormDialog'
import { EndContractDialog } from '@/pages/contracts/EndContractDialog'

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

export function ContractDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const canUpdate = hasAnyPermission([PERMISSIONS.CONTRACT_UPDATE])

  const [formOpen, setFormOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)

  const contractQuery = useContract(id)

  if (contractQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading contract…
      </div>
    )
  }

  if (contractQuery.isError || !contractQuery.data) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-destructive">
          {contractQuery.error ? getErrorMessage(contractQuery.error) : 'Contract not found.'}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => void navigate('/contracts')}>
          Back to contracts
        </Button>
      </div>
    )
  }

  const contract = contractQuery.data

  return (
    <div>
      <div className="mb-2">
        <Link
          to="/contracts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to contracts
        </Link>
      </div>

      <PageHeader
        title={contract.contractNumber}
        description={contract.employeeName}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={CONTRACT_STATUS_BADGE_VARIANT[contract.status]}>
              {CONTRACT_STATUS_LABELS[contract.status]}
            </Badge>
            {canUpdate && (
              <Button variant="outline" onClick={() => setFormOpen(true)}>
                Edit
              </Button>
            )}
            {canUpdate && contract.status !== 'ENDED' && (
              <Button variant="destructive" onClick={() => setEndOpen(true)}>
                End contract
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assignment</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Employee" value={contract.employeeName} />
            <Field label="Contract type" value={CONTRACT_TYPE_LABELS[contract.contractType]} />
            <Field label="Department" value={contract.departmentName ?? '—'} />
            <Field label="Position" value={contract.positionTitle ?? '—'} />
            <Field label="Start date" value={formatDate(contract.startDate)} />
            <Field label="End date" value={formatDate(contract.endDate)} />
            <Field label="Probation ends" value={formatDate(contract.probationEndDate)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Working time</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Weekly hours" value={String(contract.weeklyHours)} />
            <Field label="Daily hours" value={String(contract.dailyHours)} />
            <Field label="FTE" value={String(contract.fte)} />
            <Field label="Work week" value={WORK_WEEK_LABELS[contract.workWeek]} />
            <Field label="Vacation days/year" value={String(contract.vacationDaysPerYear)} />
            <Field label="Summarized time" value={contract.summarizedWorkingTime ? 'Yes' : 'No'} />
            <Field label="Can work weekends" value={contract.canWorkWeekends ? 'Yes' : 'No'} />
            <Field label="Can work holidays" value={contract.canWorkHolidays ? 'Yes' : 'No'} />
            <Field label="Can work nights" value={contract.canWorkNights ? 'Yes' : 'No'} />
          </CardContent>
        </Card>

        {contract.notes && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <ContractFormDialog open={formOpen} onOpenChange={setFormOpen} contract={contract} />
      <EndContractDialog open={endOpen} onOpenChange={setEndOpen} contract={contract} />
    </div>
  )
}
