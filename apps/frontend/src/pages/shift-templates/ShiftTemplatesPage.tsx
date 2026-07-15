import { Loader2, MoreHorizontal, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
      toast.success(t('shiftTemplates.archived'))
      setArchivingTemplate(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRestore(template: ShiftTemplate) {
    try {
      await restoreShiftTemplate.mutateAsync(template.id)
      toast.success(t('shiftTemplates.restored'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const templates = templatesQuery.data?.items ?? []

  return (
    <div>
      <PageHeader
        title={t('shiftTemplates.title')}
        description={t('shiftTemplates.description')}
        actions={
          canCreate && (
            <Button onClick={openCreateDialog}>
              <Plus />
              {t('shiftTemplates.newTemplate')}
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
                placeholder={t('shiftTemplates.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>{t('common.allStatuses')}</SelectItem>
                <SelectItem value="ACTIVE">{t('common.active')}</SelectItem>
                <SelectItem value="ARCHIVED">{t('common.archived')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('common.code')}</TableHead>
                <TableHead>{t('shiftTemplates.hours')}</TableHead>
                <TableHead>{t('shiftTemplates.break')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                {(canUpdate || canDelete) && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {templatesQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      {t('shiftTemplates.loadingTemplates')}
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {templatesQuery.isError && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <p className="text-sm text-destructive">{getErrorMessage(templatesQuery.error)}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void templatesQuery.refetch()}>
                      {t('common.tryAgain')}
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!templatesQuery.isLoading && !templatesQuery.isError && templates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {search || statusFilter !== NONE_VALUE ? t('shiftTemplates.noMatch') : t('shiftTemplates.noneYet')}
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
                    <TableCell className="text-muted-foreground">{template.breakMinutes} {t('shiftTemplates.minutesShort')}</TableCell>
                    <TableCell>
                      <Badge variant={template.active ? 'success' : 'secondary'}>
                        {template.active ? t('common.active') : t('common.archived')}
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
                              <DropdownMenuItem onClick={() => openEditDialog(template)}>{t('common.edit')}</DropdownMenuItem>
                            )}
                            {canDelete && template.active && (
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setArchivingTemplate(template)}
                              >
                                {t('common.archive')}
                              </DropdownMenuItem>
                            )}
                            {canDelete && !template.active && (
                              <DropdownMenuItem onClick={() => void handleRestore(template)}>
                                {t('common.restore')}
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
        title={t('shiftTemplates.archiveTitle')}
        description={t('shiftTemplates.archiveDescription', { name: archivingTemplate?.name })}
        confirmLabel={t('common.archive')}
        isLoading={archiveShiftTemplate.isPending}
        onConfirm={() => void confirmArchive()}
      />
    </div>
  )
}
