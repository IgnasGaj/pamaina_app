import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useApproveRequest, useRejectRequest } from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'
import type { EmployeeRequest, RequestStatus } from '@/types/request.types'

const STATUS_BADGE_VARIANT: Record<RequestStatus, 'secondary' | 'success' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  APPROVED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'outline',
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString()
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString()
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

export function RequestDetailsDialog({
  request,
  onOpenChange,
}: {
  request: EmployeeRequest | undefined
  onOpenChange: (open: boolean) => void
}) {
  const [reviewComment, setReviewComment] = useState('')
  const approveRequest = useApproveRequest()
  const rejectRequest = useRejectRequest()

  async function handleApprove() {
    if (!request) return
    try {
      await approveRequest.mutateAsync({ id: request.id, payload: { reviewComment: reviewComment || undefined } })
      toast.success('Request approved')
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleReject() {
    if (!request) return
    try {
      await rejectRequest.mutateAsync({ id: request.id, payload: { reviewComment: reviewComment || undefined } })
      toast.success('Request rejected')
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Dialog
      open={Boolean(request)}
      onOpenChange={(open) => {
        if (!open) setReviewComment('')
        onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request details</DialogTitle>
          <DialogDescription>{request?.employeeName}</DialogDescription>
        </DialogHeader>
        {request && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type" value={request.absenceTypeName} />
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={STATUS_BADGE_VARIANT[request.status]}>{request.status}</Badge>
              </div>
              <Field label="Start date" value={formatDate(request.startDate)} />
              <Field label="End date" value={formatDate(request.endDate)} />
              <Field label="Submitted" value={formatDateTime(request.createdAt)} />
              {request.reviewedAt && <Field label="Reviewed" value={formatDateTime(request.reviewedAt)} />}
            </div>
            {request.comment && <Field label="Employee comment" value={request.comment} />}
            {request.reviewComment && <Field label="Manager note" value={request.reviewComment} />}

            {request.status === 'PENDING' && (
              <div className="space-y-2">
                <Label htmlFor="reviewComment">Note to employee (optional)</Label>
                <Textarea
                  id="reviewComment"
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>
            )}
          </div>
        )}
        {request?.status === 'PENDING' && (
          <DialogFooter>
            <Button variant="destructive" disabled={rejectRequest.isPending} onClick={() => void handleReject()}>
              {rejectRequest.isPending ? 'Rejecting…' : 'Reject'}
            </Button>
            <Button disabled={approveRequest.isPending} onClick={() => void handleApprove()}>
              {approveRequest.isPending ? 'Approving…' : 'Approve'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
