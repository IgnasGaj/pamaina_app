import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

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
import { formatLongDate, formatLongDateTime, type AppLocale } from '@/lib/date'
import type { EmployeeRequest, RequestStatus } from '@/types/request.types'

const STATUS_BADGE_VARIANT: Record<RequestStatus, 'secondary' | 'success' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  APPROVED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'outline',
}

const STATUS_LABEL_KEYS: Record<RequestStatus, string> = {
  PENDING: 'requests.pending',
  APPROVED: 'requests.approved',
  REJECTED: 'requests.rejected',
  CANCELLED: 'requests.cancelled',
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
  const { t, i18n } = useTranslation()
  const locale: AppLocale = i18n.language === 'en' ? 'en' : 'lt'
  const formatDate = (value: string) => formatLongDate(value.slice(0, 10), locale)
  const [reviewComment, setReviewComment] = useState('')
  const approveRequest = useApproveRequest()
  const rejectRequest = useRejectRequest()

  async function handleApprove() {
    if (!request) return
    try {
      await approveRequest.mutateAsync({ id: request.id, payload: { reviewComment: reviewComment || undefined } })
      toast.success(t('requests.approved_toast'))
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleReject() {
    if (!request) return
    try {
      await rejectRequest.mutateAsync({ id: request.id, payload: { reviewComment: reviewComment || undefined } })
      toast.success(t('requests.rejected_toast'))
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
          <DialogTitle>{t('requests.detailsTitle')}</DialogTitle>
          <DialogDescription>{request?.employeeName}</DialogDescription>
        </DialogHeader>
        {request && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('requests.type')} value={request.absenceTypeName} />
              <div>
                <p className="text-xs text-muted-foreground">{t('common.status')}</p>
                <Badge variant={STATUS_BADGE_VARIANT[request.status]}>{t(STATUS_LABEL_KEYS[request.status])}</Badge>
              </div>
              <Field label={t('requests.startDate')} value={formatDate(request.startDate)} />
              <Field label={t('requests.endDate')} value={formatDate(request.endDate)} />
              <Field label={t('requests.submitted')} value={formatLongDateTime(request.createdAt, locale)} />
              {request.reviewedAt && <Field label={t('requests.reviewed')} value={formatLongDateTime(request.reviewedAt, locale)} />}
            </div>
            {request.comment && <Field label={t('requests.employeeComment')} value={request.comment} />}
            {request.reviewComment && <Field label={t('requests.managerNote')} value={request.reviewComment} />}

            {request.status === 'PENDING' && (
              <div className="space-y-2">
                <Label htmlFor="reviewComment">{t('requests.noteToEmployee')}</Label>
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
              {rejectRequest.isPending ? t('requests.rejecting') : t('requests.reject')}
            </Button>
            <Button disabled={approveRequest.isPending} onClick={() => void handleApprove()}>
              {approveRequest.isPending ? t('requests.approving') : t('requests.approve')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
