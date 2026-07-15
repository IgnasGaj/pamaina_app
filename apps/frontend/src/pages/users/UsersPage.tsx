import { MoreHorizontal, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

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
import { useCompanyUsers, useDeleteUser } from '@/hooks/useUsers'
import { getErrorMessage } from '@/lib/errors'
import { UserFormDialog } from '@/pages/users/UserFormDialog'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'
import type { CompanyUser } from '@/types/user.types'

export function UsersPage() {
  const { t } = useTranslation()
  const currentUser = useAuthStore((state) => state.user)
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const canCreate = hasAnyPermission([PERMISSIONS.USER_CREATE])
  const canUpdate = hasAnyPermission([PERMISSIONS.USER_UPDATE])
  const canDelete = hasAnyPermission([PERMISSIONS.USER_DELETE])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<CompanyUser | undefined>(undefined)
  const [deletingUser, setDeletingUser] = useState<CompanyUser | undefined>(undefined)

  const usersQuery = useCompanyUsers({ page, pageSize: 10, search: search || undefined })
  const deleteUser = useDeleteUser()

  function openCreateDialog() {
    setEditingUser(undefined)
    setFormOpen(true)
  }

  function openEditDialog(user: CompanyUser) {
    setEditingUser(user)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deletingUser) return
    try {
      await deleteUser.mutateAsync(deletingUser.id)
      toast.success(t('users.removed'))
      setDeletingUser(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader
        title={t('users.title')}
        description={t('users.description')}
        actions={
          canCreate && (
            <Button onClick={openCreateDialog}>
              <Plus />
              {t('users.inviteMember')}
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
              placeholder={t('users.searchPlaceholder')}
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
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('common.email')}</TableHead>
                <TableHead>{t('users.role')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('users.lastLogin')}</TableHead>
                {(canUpdate || canDelete) && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.data?.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{user.roleName}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'success' : 'secondary'}>
                      {user.isActive ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : t('common.never')}
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
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>{t('common.edit')}</DropdownMenuItem>
                          )}
                          {canDelete && user.id !== currentUser?.id && (
                            <DropdownMenuItem variant="destructive" onClick={() => setDeletingUser(user)}>
                              {t('common.remove')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {usersQuery.data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {t('users.noneFound')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {usersQuery.data && <PaginationBar meta={usersQuery.data.meta} onPageChange={setPage} />}
        </CardContent>
      </Card>

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editingUser} />

      <ConfirmDialog
        open={Boolean(deletingUser)}
        onOpenChange={(open) => !open && setDeletingUser(undefined)}
        title={t('users.removeTitle')}
        description={t('users.removeDescription', { name: `${deletingUser?.firstName} ${deletingUser?.lastName}` })}
        confirmLabel={t('common.remove')}
        isLoading={deleteUser.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
