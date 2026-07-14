import { Loader2, MoreHorizontal, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PaginationBar } from '@/components/shared/PaginationBar'
import { ContractFormDialog } from '@/pages/contracts/ContractFormDialog'
import { EndContractDialog } from '@/pages/contracts/EndContractDialog'
import { useDepartments } from '@/hooks/useDepartments'
import { useContracts } from '@/hooks/useContracts'
import { usePositions } from '@/hooks/usePositions'
import { getErrorMessage } from '@/lib/errors'
import { CONTRACT_STATUS_BADGE_VARIANT, CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS } from '@/lib/contract-options'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'
import type { ContractStatus, EmploymentContract } from '@/types/contract.types'

const NONE_VALUE = '__all__'

const STATUS_FILTER_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'ENDED', label: 'Ended' },
]

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

export function ContractsPage() {
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const canCreate = hasAnyPermission([PERMISSIONS.CONTRACT_CREATE])
  const canUpdate = hasAnyPermission([PERMISSIONS.CONTRACT_UPDATE])

  const [page, setPage] = useState(1)
  const [departmentFilter, setDepartmentFilter] = useState(NONE_VALUE)
  const [positionFilter, setPositionFilter] = useState(NONE_VALUE)
  const [statusFilter, setStatusFilter] = useState(NONE_VALUE)
  const [formOpen, setFormOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<EmploymentContract | undefined>(undefined)
  const [endingContract, setEndingContract] = useState<EmploymentContract | undefined>(undefined)

  const departmentsQuery = useDepartments({ pageSize: 100 })
  const positionsQuery = usePositions({ pageSize: 100 })

  const contractsQuery = useContracts({
    page,
    pageSize: 20,
    departmentId: departmentFilter === NONE_VALUE ? undefined : departmentFilter,
    positionId: positionFilter === NONE_VALUE ? undefined : positionFilter,
    status: statusFilter === NONE_VALUE ? undefined : (statusFilter as ContractStatus),
  })

  function resetToFirstPage() {
    setPage(1)
  }

  function openCreateDialog() {
    setEditingContract(undefined)
    setFormOpen(true)
  }

  function openEditDialog(contract: EmploymentContract) {
    setEditingContract(contract)
    setFormOpen(true)
  }

  const contracts = contractsQuery.data?.items ?? []

  return (
    <div>
      <PageHeader
        title="Employment contracts"
        description="Manage employment terms for your workforce."
        actions={
          canCreate && (
            <Button onClick={openCreateDialog}>
              <Plus />
              New contract
            </Button>
          )
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
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
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Contract type</TableHead>
                <TableHead>Weekly hours</TableHead>
                <TableHead>FTE</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start date</TableHead>
                <TableHead>End date</TableHead>
                {canUpdate && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractsQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading contracts…
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {contractsQuery.isError && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center">
                    <p className="text-sm text-destructive">{getErrorMessage(contractsQuery.error)}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => void contractsQuery.refetch()}
                    >
                      Try again
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!contractsQuery.isLoading && !contractsQuery.isError && contracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                    {departmentFilter !== NONE_VALUE || positionFilter !== NONE_VALUE || statusFilter !== NONE_VALUE
                      ? 'No contracts match your filters.'
                      : 'No contracts yet. Create your first employment contract to get started.'}
                  </TableCell>
                </TableRow>
              )}

              {!contractsQuery.isLoading &&
                !contractsQuery.isError &&
                contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      <Link to={`/employees/${contract.employeeId}`} className="hover:underline">
                        {contract.employeeName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{contract.departmentName ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{contract.positionTitle ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {CONTRACT_TYPE_LABELS[contract.contractType]}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{contract.weeklyHours}</TableCell>
                    <TableCell className="text-muted-foreground">{contract.fte}</TableCell>
                    <TableCell>
                      <Badge variant={CONTRACT_STATUS_BADGE_VARIANT[contract.status]}>
                        {CONTRACT_STATUS_LABELS[contract.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(contract.startDate)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(contract.endDate)}</TableCell>
                    {canUpdate && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(contract)}>Edit</DropdownMenuItem>
                            {contract.status !== 'ENDED' && (
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setEndingContract(contract)}
                              >
                                End contract
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

          {contractsQuery.data && <PaginationBar meta={contractsQuery.data.meta} onPageChange={setPage} />}
        </CardContent>
      </Card>

      <ContractFormDialog open={formOpen} onOpenChange={setFormOpen} contract={editingContract} />

      <EndContractDialog
        open={Boolean(endingContract)}
        onOpenChange={(open) => !open && setEndingContract(undefined)}
        contract={endingContract}
      />
    </div>
  )
}
