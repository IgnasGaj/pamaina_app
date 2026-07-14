import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEndContract } from '@/hooks/useContracts'
import { getErrorMessage } from '@/lib/errors'
import type { EmploymentContract } from '@/types/contract.types'

export function EndContractDialog({
  open,
  onOpenChange,
  contract,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract: EmploymentContract | undefined
}) {
  const [endDate, setEndDate] = useState('')
  const endContract = useEndContract(contract?.id ?? '', contract?.employeeId)

  async function handleConfirm() {
    if (!contract) return
    try {
      await endContract.mutateAsync(endDate ? { endDate } : {})
      toast.success('Contract ended')
      setEndDate('')
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setEndDate('')
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End contract</DialogTitle>
          <DialogDescription>
            {contract
              ? `Are you sure you want to end the contract for ${contract.employeeName}? This cannot be undone.`
              : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="contractEndDate">End date</Label>
          <Input
            id="contractEndDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Defaults to today"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={endContract.isPending} onClick={() => void handleConfirm()}>
            {endContract.isPending ? 'Ending…' : 'End contract'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
