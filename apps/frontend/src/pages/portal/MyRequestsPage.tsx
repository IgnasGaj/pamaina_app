import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useCancelRequest, useRequests } from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'
import { formatLongDate, type AppLocale } from '@/lib/date'
import type { EmployeeRequest, RequestStatus } from '@/types/request.types'
import { RequestFormDialog } from '@/pages/portal/RequestFormDialog'

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

export function MyRequestsPage() {
  const { t, i18n } = useTranslation()
  const locale: AppLocale = i18n.language === 'en' ? 'en' : 'lt'
  const formatDate = (value: string) => formatLongDate(value.slice(0, 10), locale)
  const [formOpen, setFormOpen] = useState(false)
  const [cancellingRequest, setCancellingRequest] = useState<EmployeeRequest | undefined>(undefined)

  const requestsQuery = useRequests({ pageSize: 100 })
  const cancelRequest = useCancelRequest()

  async function confirmCancel() {
    if (!cancellingRequest) return
    try {
      await cancelRequest.mutateAsync(cancellingRequest.id)
      toast.success(t('requests.requestCancelled'))
      setCancellingRequest(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const requests = requestsQuery.data?.items ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('requests.myRequestsTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('requests.myRequestsDescription')}</p>
        </div>
        <Button size="icon" onClick={() => setFormOpen(true)} aria-label={t('requests.newRequest')}>
          <Plus />
        </Button>
      </div>

      {requestsQuery.isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t('requests.loadingRequests')}
        </div>
      )}

      {requestsQuery.isError && (
        <p className="py-8 text-center text-sm text-destructive">{getErrorMessage(requestsQuery.error)}</p>
      )}

      {!requestsQuery.isLoading && !requestsQuery.isError && requests.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t('requests.noneYet')}
          </CardContent>
        </Card>
      )}

      {!requestsQuery.isLoading && !requestsQuery.isError && (
        <div className="space-y-2">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: request.absenceTypeColor }}
                        aria-hidden
                      />
                      <p className="font-medium">{request.absenceTypeName}</p>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatDate(request.startDate)} – {formatDate(request.endDate)}
                    </p>
                    {request.comment && <p className="mt-1 text-sm">{request.comment}</p>}
                    {request.status !== 'PENDING' && request.reviewComment && (
                      <p className="mt-1 text-xs text-muted-foreground">{t('requests.managerNotePrefix', { note: request.reviewComment })}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge variant={STATUS_BADGE_VARIANT[request.status]}>{t(STATUS_LABEL_KEYS[request.status])}</Badge>
                    {request.status === 'PENDING' && (
                      <Button variant="outline" size="sm" onClick={() => setCancellingRequest(request)}>
                        {t('requests.cancel')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RequestFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={Boolean(cancellingRequest)}
        onOpenChange={(open) => !open && setCancellingRequest(undefined)}
        title={t('requests.cancelRequestTitle')}
        description={t('requests.cancelRequestDescription', { type: cancellingRequest?.absenceTypeName.toLowerCase() })}
        confirmLabel={t('requests.cancel')}
        isLoading={cancelRequest.isPending}
        onConfirm={() => void confirmCancel()}
      />
    </div>
  )
}
