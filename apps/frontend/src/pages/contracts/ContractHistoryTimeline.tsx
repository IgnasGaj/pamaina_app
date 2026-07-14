import { Badge } from '@/components/ui/badge'
import { CONTRACT_STATUS_BADGE_VARIANT, CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS } from '@/lib/contract-options'
import type { EmploymentContract } from '@/types/contract.types'

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

export function ContractHistoryTimeline({
  contracts,
  onSelect,
}: {
  contracts: EmploymentContract[]
  onSelect?: (contract: EmploymentContract) => void
}) {
  if (contracts.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No contracts yet.</p>
  }

  const sorted = [...contracts].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  )

  return (
    <ol className="space-y-3">
      {sorted.map((contract) => {
        const isActive = contract.status === 'ACTIVE'
        return (
          <li
            key={contract.id}
            className={`rounded-lg border p-3 ${isActive ? 'border-primary/50 bg-primary/5' : 'border-border'} ${
              onSelect ? 'cursor-pointer hover:bg-accent/50' : ''
            }`}
            onClick={() => onSelect?.(contract)}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{contract.contractNumber}</span>
                <Badge variant={CONTRACT_STATUS_BADGE_VARIANT[contract.status]}>
                  {CONTRACT_STATUS_LABELS[contract.status]}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
              <span>{CONTRACT_TYPE_LABELS[contract.contractType]}</span>
              {contract.departmentName && <span>{contract.departmentName}</span>}
              {contract.positionTitle && <span>{contract.positionTitle}</span>}
              <span>{contract.weeklyHours}h/week</span>
              <span>FTE {contract.fte}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
