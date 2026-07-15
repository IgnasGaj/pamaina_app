import { Loader2, MoreHorizontal, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PaginationBar } from '@/components/shared/PaginationBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getErrorMessage } from '@/lib/errors'
import { useArchivePosition, usePositions, useRestorePosition } from '@/hooks/usePositions'
import { PositionFormDialog } from '@/pages/positions/PositionFormDialog'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'
import type { Position, PositionSortBy, PositionStatusFilter } from '@/types/position.types'

const NONE_VALUE = '__all__'

interface SortOption {
  value: string
  sortBy: PositionSortBy
  sortOrder: 'asc' | 'desc'
  label: string
}

export function PositionsPage() {
  const { t } = useTranslation()
  const SORT_OPTIONS: SortOption[] = [
    { value: 'name-asc', sortBy: 'name', sortOrder: 'asc', label: t('common.nameAZ') },
    { value: 'name-desc', sortBy: 'name', sortOrder: 'desc', label: t('common.nameZA') },
    { value: 'createdAt-desc', sortBy: 'createdAt', sortOrder: 'desc', label: t('common.recentlyCreated') },
    { value: 'createdAt-asc', sortBy: 'createdAt', sortOrder: 'asc', label: t('common.oldestCreated') },
    { value: 'employeeCount-desc', sortBy: 'employeeCount', sortOrder: 'desc', label: t('common.mostEmployees') },
    { value: 'employeeCount-asc', sortBy: 'employeeCount', sortOrder: 'asc', label: t('common.fewestEmployees') },
  ]
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const canCreate = hasAnyPermission([PERMISSIONS.POSITION_CREATE])
  const canUpdate = hasAnyPermission([PERMISSIONS.POSITION_UPDATE])
  const canDelete = hasAnyPermission([PERMISSIONS.POSITION_DELETE])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(NONE_VALUE)
  const [sort, setSort] = useState('name-asc')
  const [formOpen, setFormOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | undefined>(undefined)
  const [archivingPosition, setArchivingPosition] = useState<Position | undefined>(undefined)

  const activeSort = SORT_OPTIONS.find((option) => option.value === sort) ?? SORT_OPTIONS[0]

  const positionsQuery = usePositions({
    page,
    pageSize: 20,
    search: search || undefined,
    status: statusFilter === NONE_VALUE ? undefined : (statusFilter as PositionStatusFilter),
    sortBy: activeSort.sortBy,
    sortOrder: activeSort.sortOrder,
  })
  const archivePosition = useArchivePosition()
  const restorePosition = useRestorePosition()

  function openCreateDialog() {
    setEditingPosition(undefined)
    setFormOpen(true)
  }

  function openEditDialog(position: Position) {
    setEditingPosition(position)
    setFormOpen(true)
  }

  function resetToFirstPage() {
    setPage(1)
  }

  async function confirmArchive() {
    if (!archivingPosition) return
    try {
      await archivePosition.mutateAsync(archivingPosition.id)
      toast.success(t('positions.archived'))
      setArchivingPosition(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRestore(position: Position) {
    try {
      await restorePosition.mutateAsync(position.id)
      toast.success(t('positions.restored'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const positions = positionsQuery.data?.items ?? []

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('positions.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              resetToFirstPage()
            }}
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value)
            resetToFirstPage()
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('common.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>{t('common.allStatuses')}</SelectItem>
            <SelectItem value="ACTIVE">{t('common.active')}</SelectItem>
            <SelectItem value="ARCHIVED">{t('common.archived')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('common.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canCreate && (
          <Button className="ml-auto" onClick={openCreateDialog}>
            <Plus />
            {t('positions.newPosition')}
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('common.title')}</TableHead>
            <TableHead>{t('common.department')}</TableHead>
            <TableHead>{t('common.employees')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            {(canUpdate || canDelete) && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {positionsQuery.isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {t('positions.loadingPositions')}
                </div>
              </TableCell>
            </TableRow>
          )}

          {positionsQuery.isError && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center">
                <p className="text-sm text-destructive">{getErrorMessage(positionsQuery.error)}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => void positionsQuery.refetch()}>
                  {t('common.tryAgain')}
                </Button>
              </TableCell>
            </TableRow>
          )}

          {!positionsQuery.isLoading && !positionsQuery.isError && positions.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                {search || statusFilter !== NONE_VALUE ? t('positions.noMatch') : t('positions.noneYet')}
              </TableCell>
            </TableRow>
          )}

          {!positionsQuery.isLoading &&
            !positionsQuery.isError &&
            positions.map((position) => (
              <TableRow key={position.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: position.color }}
                      aria-hidden
                    />
                    {position.title}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{position.departmentName ?? '—'}</TableCell>
                <TableCell>{position.employeeCount}</TableCell>
                <TableCell>
                  <Badge variant={position.isArchived ? 'secondary' : position.isActive ? 'success' : 'warning'}>
                    {position.isArchived ? t('common.archived') : position.isActive ? t('common.active') : t('common.inactive')}
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
                          <DropdownMenuItem onClick={() => openEditDialog(position)}>{t('common.edit')}</DropdownMenuItem>
                        )}
                        {canDelete && !position.isArchived && (
                          <DropdownMenuItem variant="destructive" onClick={() => setArchivingPosition(position)}>
                            {t('common.archive')}
                          </DropdownMenuItem>
                        )}
                        {canDelete && position.isArchived && (
                          <DropdownMenuItem onClick={() => void handleRestore(position)}>{t('common.restore')}</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {positionsQuery.data && <PaginationBar meta={positionsQuery.data.meta} onPageChange={setPage} />}

      <PositionFormDialog open={formOpen} onOpenChange={setFormOpen} position={editingPosition} />

      <ConfirmDialog
        open={Boolean(archivingPosition)}
        onOpenChange={(open) => !open && setArchivingPosition(undefined)}
        title={t('positions.archiveTitle')}
        description={t('positions.archiveDescription', { title: archivingPosition?.title })}
        confirmLabel={t('common.archive')}
        isLoading={archivePosition.isPending}
        onConfirm={() => void confirmArchive()}
      />
    </div>
  )
}
