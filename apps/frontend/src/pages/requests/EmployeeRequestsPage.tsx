import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useApproveRequest, useRejectRequest, useRequests } from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'
import { formatLongDate, type AppLocale } from '@/lib/date'
import type { EmployeeRequest, RequestStatus } from '@/types/request.types'
import { RequestDetailsDialog } from '@/pages/requests/RequestDetailsDialog'

const NONE_VALUE = '__all__'

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

export function EmployeeRequestsPage() {
  const { t, i18n } = useTranslation()
  const locale: AppLocale = i18n.language === 'en' ? 'en' : 'lt'
  const formatDate = (value: string) => formatLongDate(value.slice(0, 10), locale)
  const [statusFilter, setStatusFilter] = useState(NONE_VALUE)
  const [detailsRequest, setDetailsRequest] = useState<EmployeeRequest | undefined>(undefined)

  const requestsQuery = useRequests({
    pageSize: 100,
    status: statusFilter === NONE_VALUE ? undefined : (statusFilter as RequestStatus),
  })
  const approveRequest = useApproveRequest()
  const rejectRequest = useRejectRequest()

  async function handleApprove(request: EmployeeRequest) {
    try {
      await approveRequest.mutateAsync({ id: request.id })
      toast.success(t('requests.approved_toast'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleReject(request: EmployeeRequest) {
    try {
      await rejectRequest.mutateAsync({ id: request.id })
      toast.success(t('requests.rejected_toast'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const requests = requestsQuery.data?.items ?? []

  return (
    <div>
      <PageHeader title={t('requests.title')} description={t('requests.description')} />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>{t('requests.allStatuses')}</SelectItem>
                <SelectItem value="PENDING">{t('requests.pending')}</SelectItem>
                <SelectItem value="APPROVED">{t('requests.approved')}</SelectItem>
                <SelectItem value="REJECTED">{t('requests.rejected')}</SelectItem>
                <SelectItem value="CANCELLED">{t('requests.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('requests.employee')}</TableHead>
                <TableHead>{t('requests.type')}</TableHead>
                <TableHead>{t('requests.date')}</TableHead>
                <TableHead>{t('requests.comment')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('requests.submitted')}</TableHead>
                <TableHead className="w-56" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {requestsQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      {t('requests.loadingRequests')}
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {requestsQuery.isError && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    <p className="text-sm text-destructive">{getErrorMessage(requestsQuery.error)}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void requestsQuery.refetch()}>
                      {t('common.tryAgain')}
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!requestsQuery.isLoading && !requestsQuery.isError && requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    {t('requests.noMatch')}
                  </TableCell>
                </TableRow>
              )}

              {!requestsQuery.isLoading &&
                !requestsQuery.isError &&
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.employeeName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: request.absenceTypeColor }}
                          aria-hidden
                        />
                        {request.absenceTypeName}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(request.startDate)} – {formatDate(request.endDate)}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground">{request.comment ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[request.status]}>{t(STATUS_LABEL_KEYS[request.status])}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(request.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {request.status === 'PENDING' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => void handleApprove(request)}>
                              {t('requests.approve')}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => void handleReject(request)}>
                              {t('requests.reject')}
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setDetailsRequest(request)}>
                          {t('requests.details')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RequestDetailsDialog request={detailsRequest} onOpenChange={(open) => !open && setDetailsRequest(undefined)} />
    </div>
  )
}
