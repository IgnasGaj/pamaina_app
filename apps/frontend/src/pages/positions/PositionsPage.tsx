import { Loader2, MoreHorizontal, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

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

const SORT_OPTIONS: SortOption[] = [
  { value: 'name-asc', sortBy: 'name', sortOrder: 'asc', label: 'Name (A–Z)' },
  { value: 'name-desc', sortBy: 'name', sortOrder: 'desc', label: 'Name (Z–A)' },
  { value: 'createdAt-desc', sortBy: 'createdAt', sortOrder: 'desc', label: 'Recently created' },
  { value: 'createdAt-asc', sortBy: 'createdAt', sortOrder: 'asc', label: 'Oldest created' },
  { value: 'employeeCount-desc', sortBy: 'employeeCount', sortOrder: 'desc', label: 'Most employees' },
  { value: 'employeeCount-asc', sortBy: 'employeeCount', sortOrder: 'asc', label: 'Fewest employees' },
]

export function PositionsPage() {
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
      toast.success('Position archived')
      setArchivingPosition(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRestore(position: Position) {
    try {
      await restorePosition.mutateAsync(position.id)
      toast.success('Position restored')
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
            placeholder="Search positions…"
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
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
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
            New position
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Employees</TableHead>
            <TableHead>Status</TableHead>
            {(canUpdate || canDelete) && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {positionsQuery.isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Loading positions…
                </div>
              </TableCell>
            </TableRow>
          )}

          {positionsQuery.isError && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center">
                <p className="text-sm text-destructive">{getErrorMessage(positionsQuery.error)}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => void positionsQuery.refetch()}>
                  Try again
                </Button>
              </TableCell>
            </TableRow>
          )}

          {!positionsQuery.isLoading && !positionsQuery.isError && positions.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                {search || statusFilter !== NONE_VALUE
                  ? 'No positions match your filters.'
                  : 'No positions yet. Add your first position to get started.'}
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
                    {position.isArchived ? 'Archived' : position.isActive ? 'Active' : 'Inactive'}
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
                          <DropdownMenuItem onClick={() => openEditDialog(position)}>Edit</DropdownMenuItem>
                        )}
                        {canDelete && !position.isArchived && (
                          <DropdownMenuItem variant="destructive" onClick={() => setArchivingPosition(position)}>
                            Archive
                          </DropdownMenuItem>
                        )}
                        {canDelete && position.isArchived && (
                          <DropdownMenuItem onClick={() => void handleRestore(position)}>Restore</DropdownMenuItem>
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
        title="Archive position"
        description={`Are you sure you want to archive "${archivingPosition?.title}"? It will be hidden from the default list but can be restored at any time.`}
        confirmLabel="Archive"
        isLoading={archivePosition.isPending}
        onConfirm={() => void confirmArchive()}
      />
    </div>
  )
}
