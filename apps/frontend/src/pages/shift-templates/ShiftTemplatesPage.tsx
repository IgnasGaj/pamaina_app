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
import { useArchiveShiftTemplate, useRestoreShiftTemplate, useShiftTemplates } from '@/hooks/useShiftTemplates'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'
import type { ShiftTemplate, ShiftTemplateStatusFilter } from '@/types/shift-template.types'
import { ShiftTemplateFormDialog } from '@/pages/shift-templates/ShiftTemplateFormDialog'

const NONE_VALUE = '__all__'

export function ShiftTemplatesPage() {
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const canCreate = hasAnyPermission([PERMISSIONS.SHIFT_TEMPLATE_CREATE])
  const canUpdate = hasAnyPermission([PERMISSIONS.SHIFT_TEMPLATE_UPDATE])
  const canDelete = hasAnyPermission([PERMISSIONS.SHIFT_TEMPLATE_DELETE])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(NONE_VALUE)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | undefined>(undefined)
  const [archivingTemplate, setArchivingTemplate] = useState<ShiftTemplate | undefined>(undefined)

  const templatesQuery = useShiftTemplates({
    pageSize: 100,
    search: search || undefined,
    status: statusFilter === NONE_VALUE ? undefined : (statusFilter as ShiftTemplateStatusFilter),
    sortBy: 'startTime',
    sortOrder: 'asc',
  })
  const archiveShiftTemplate = useArchiveShiftTemplate()
  const restoreShiftTemplate = useRestoreShiftTemplate()

  function openCreateDialog() {
    setEditingTemplate(undefined)
    setFormOpen(true)
  }

  function openEditDialog(template: ShiftTemplate) {
    setEditingTemplate(template)
    setFormOpen(true)
  }

  async function confirmArchive() {
    if (!archivingTemplate) return
    try {
      await archiveShiftTemplate.mutateAsync(archivingTemplate.id)
      toast.success('Shift template archived')
      setArchivingTemplate(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRestore(template: ShiftTemplate) {
    try {
      await restoreShiftTemplate.mutateAsync(template.id)
      toast.success('Shift template restored')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const templates = templatesQuery.data?.items ?? []

  return (
    <div>
      <PageHeader
        title="Shift templates"
        description="Define the shifts your team can be scheduled into."
        actions={
          canCreate && (
            <Button onClick={openCreateDialog}>
              <Plus />
              New shift template
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
                placeholder="Search shift templates…"
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
                <TableHead>Code</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Break</TableHead>
                <TableHead>Status</TableHead>
                {(canUpdate || canDelete) && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {templatesQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading shift templates…
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {templatesQuery.isError && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <p className="text-sm text-destructive">{getErrorMessage(templatesQuery.error)}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void templatesQuery.refetch()}>
                      Try again
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!templatesQuery.isLoading && !templatesQuery.isError && templates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {search || statusFilter !== NONE_VALUE
                      ? 'No shift templates match your filters.'
                      : 'No shift templates yet. Create your first one to start scheduling.'}
                  </TableCell>
                </TableRow>
              )}

              {!templatesQuery.isLoading &&
                !templatesQuery.isError &&
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: template.color }}
                          aria-hidden
                        />
                        {template.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{template.shortCode}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {template.startTime}–{template.endTime}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{template.breakMinutes} min</TableCell>
                    <TableCell>
                      <Badge variant={template.active ? 'success' : 'secondary'}>
                        {template.active ? 'Active' : 'Archived'}
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
                              <DropdownMenuItem onClick={() => openEditDialog(template)}>Edit</DropdownMenuItem>
                            )}
                            {canDelete && template.active && (
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setArchivingTemplate(template)}
                              >
                                Archive
                              </DropdownMenuItem>
                            )}
                            {canDelete && !template.active && (
                              <DropdownMenuItem onClick={() => void handleRestore(template)}>
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

      <ShiftTemplateFormDialog open={formOpen} onOpenChange={setFormOpen} template={editingTemplate} />

      <ConfirmDialog
        open={Boolean(archivingTemplate)}
        onOpenChange={(open) => !open && setArchivingTemplate(undefined)}
        title="Archive shift template"
        description={`Are you sure you want to archive "${archivingTemplate?.name}"? Past schedules keep showing it, but it can no longer be assigned to new shifts. You can restore it at any time.`}
        confirmLabel="Archive"
        isLoading={archiveShiftTemplate.isPending}
        onConfirm={() => void confirmArchive()}
      />
    </div>
  )
}
