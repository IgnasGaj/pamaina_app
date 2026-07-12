import { MoreHorizontal, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PaginationBar } from '@/components/shared/PaginationBar'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getErrorMessage } from '@/lib/errors'
import { useDeletePosition, usePositions } from '@/hooks/usePositions'
import { PositionFormDialog } from '@/pages/positions/PositionFormDialog'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'
import type { Position } from '@/types/position.types'

export function PositionsPage() {
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const canCreate = hasAnyPermission([PERMISSIONS.POSITION_CREATE])
  const canUpdate = hasAnyPermission([PERMISSIONS.POSITION_UPDATE])
  const canDelete = hasAnyPermission([PERMISSIONS.POSITION_DELETE])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | undefined>(undefined)
  const [deletingPosition, setDeletingPosition] = useState<Position | undefined>(undefined)

  const positionsQuery = usePositions({ page, pageSize: 10, search: search || undefined })
  const deletePosition = useDeletePosition()

  function openCreateDialog() {
    setEditingPosition(undefined)
    setFormOpen(true)
  }

  function openEditDialog(position: Position) {
    setEditingPosition(position)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deletingPosition) return
    try {
      await deletePosition.mutateAsync(deletingPosition.id)
      toast.success('Position deleted')
      setDeletingPosition(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader
        title="Positions"
        description="Define job titles and link them to departments."
        actions={
          canCreate && (
            <Button onClick={openCreateDialog}>
              <Plus />
              New position
            </Button>
          )
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search positions…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
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
              {positionsQuery.data?.items.map((position) => (
                <TableRow key={position.id}>
                  <TableCell className="font-medium">{position.title}</TableCell>
                  <TableCell className="text-muted-foreground">{position.departmentName ?? '—'}</TableCell>
                  <TableCell>{position.employeeCount}</TableCell>
                  <TableCell>
                    <Badge variant={position.isActive ? 'success' : 'secondary'}>
                      {position.isActive ? 'Active' : 'Inactive'}
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
                          {canDelete && (
                            <DropdownMenuItem variant="destructive" onClick={() => setDeletingPosition(position)}>
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {positionsQuery.data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No positions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {positionsQuery.data && <PaginationBar meta={positionsQuery.data.meta} onPageChange={setPage} />}
        </CardContent>
      </Card>

      <PositionFormDialog open={formOpen} onOpenChange={setFormOpen} position={editingPosition} />

      <ConfirmDialog
        open={Boolean(deletingPosition)}
        onOpenChange={(open) => !open && setDeletingPosition(undefined)}
        title="Delete position"
        description={`Are you sure you want to delete "${deletingPosition?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deletePosition.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
