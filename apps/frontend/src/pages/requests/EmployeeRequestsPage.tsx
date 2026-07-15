import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useApproveRequest, useRejectRequest, useRequests } from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'
import type { EmployeeRequest, RequestStatus } from '@/types/request.types'
import { RequestDetailsDialog } from '@/pages/requests/RequestDetailsDialog'

const NONE_VALUE = '__all__'

const STATUS_BADGE_VARIANT: Record<RequestStatus, 'secondary' | 'success' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  APPROVED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'outline',
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString()
}

export function EmployeeRequestsPage() {
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
      toast.success('Request approved')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleReject(request: EmployeeRequest) {
    try {
      await rejectRequest.mutateAsync({ id: request.id })
      toast.success('Request rejected')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const requests = requestsQuery.data?.items ?? []

  return (
    <div>
      <PageHeader title="Employee requests" description="Review and respond to absence requests." />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="w-56" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {requestsQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading requests…
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {requestsQuery.isError && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    <p className="text-sm text-destructive">{getErrorMessage(requestsQuery.error)}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void requestsQuery.refetch()}>
                      Try again
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!requestsQuery.isLoading && !requestsQuery.isError && requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No requests match your filters.
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
                      <Badge variant={STATUS_BADGE_VARIANT[request.status]}>{request.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(request.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {request.status === 'PENDING' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => void handleApprove(request)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => void handleReject(request)}>
                              Reject
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setDetailsRequest(request)}>
                          Details
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
