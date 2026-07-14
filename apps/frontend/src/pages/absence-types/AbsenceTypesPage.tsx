import { Loader2, MoreHorizontal, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAbsenceTypes, useArchiveAbsenceType, useRestoreAbsenceType } from '@/hooks/useAbsenceTypes'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'
import type { AbsenceType, AbsenceTypeStatusFilter } from '@/types/absence-type.types'
import { AbsenceTypeFormDialog } from '@/pages/absence-types/AbsenceTypeFormDialog'

const NONE_VALUE = '__all__'

export function AbsenceTypesPage() {
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const canCreate = hasAnyPermission([PERMISSIONS.ABSENCE_TYPE_CREATE])
  const canUpdate = hasAnyPermission([PERMISSIONS.ABSENCE_TYPE_UPDATE])
  const canDelete = hasAnyPermission([PERMISSIONS.ABSENCE_TYPE_DELETE])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(NONE_VALUE)
  const [formOpen, setFormOpen] = useState(false)
  const [editingType, setEditingType] = useState<AbsenceType | undefined>(undefined)
  const [archivingType, setArchivingType] = useState<AbsenceType | undefined>(undefined)

  const absenceTypesQuery = useAbsenceTypes({
    pageSize: 100,
    search: search || undefined,
    status: statusFilter === NONE_VALUE ? undefined : (statusFilter as AbsenceTypeStatusFilter),
    sortBy: 'name',
    sortOrder: 'asc',
  })
  const archiveAbsenceType = useArchiveAbsenceType()
  const restoreAbsenceType = useRestoreAbsenceType()

  function openCreateDialog() {
    setEditingType(undefined)
    setFormOpen(true)
  }

  function openEditDialog(absenceType: AbsenceType) {
    setEditingType(absenceType)
    setFormOpen(true)
  }

  async function confirmArchive() {
    if (!archivingType) return
    try {
      await archiveAbsenceType.mutateAsync(archivingType.id)
      toast.success('Absence type archived')
      setArchivingType(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRestore(absenceType: AbsenceType) {
    try {
      await restoreAbsenceType.mutateAsync(absenceType.id)
      toast.success('Absence type restored')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const absenceTypes = absenceTypesQuery.data?.items ?? []

  return (
    <div>
      <PageHeader
        title="Absence types"
        description="Define the non-working entries your team can be scheduled into, like vacation or sick leave."
        actions={
          canCreate && (
            <Button onClick={openCreateDialog}>
              <Plus />
              New absence type
            </Button>
          )
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search absence types…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
                {(canUpdate || canDelete) && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {absenceTypesQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading absence types…
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {absenceTypesQuery.isError && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center">
                    <p className="text-sm text-destructive">{getErrorMessage(absenceTypesQuery.error)}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void absenceTypesQuery.refetch()}>
                      Try again
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!absenceTypesQuery.isLoading && !absenceTypesQuery.isError && absenceTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    {search || statusFilter !== NONE_VALUE
                      ? 'No absence types match your filters.'
                      : 'No absence types yet. Create your first one to start scheduling.'}
                  </TableCell>
                </TableRow>
              )}

              {!absenceTypesQuery.isLoading &&
                !absenceTypesQuery.isError &&
                absenceTypes.map((absenceType) => (
                  <TableRow key={absenceType.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: absenceType.color }}
                          aria-hidden
                        />
                        {absenceType.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{absenceType.paid ? 'Paid' : 'Unpaid'}</TableCell>
                    <TableCell>
                      <Badge variant={absenceType.active ? 'success' : 'secondary'}>
                        {absenceType.active ? 'Active' : 'Archived'}
                      </Badge>
                    </TableCell>
                    {(canUpdate || canDelete) && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdate && (
                              <DropdownMenuItem onClick={() => openEditDialog(absenceType)}>Edit</DropdownMenuItem>
                            )}
                            {canDelete && absenceType.active && (
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setArchivingType(absenceType)}
                              >
                                Archive
                              </DropdownMenuItem>
                            )}
                            {canDelete && !absenceType.active && (
                              <DropdownMenuItem onClick={() => void handleRestore(absenceType)}>
                                Restore
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
        </CardContent>
      </Card>

      <AbsenceTypeFormDialog open={formOpen} onOpenChange={setFormOpen} absenceType={editingType} />

      <ConfirmDialog
        open={Boolean(archivingType)}
        onOpenChange={(open) => !open && setArchivingType(undefined)}
        title="Archive absence type"
        description={`Are you sure you want to archive "${archivingType?.name}"? Past schedules keep showing it, but it can no longer be assigned to new absences. You can restore it at any time.`}
        confirmLabel="Archive"
        isLoading={archiveAbsenceType.isPending}
        onConfirm={() => void confirmArchive()}
      />
    </div>
  )
}
