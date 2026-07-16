import { Loader2, Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAbsenceTypes } from '@/hooks/useAbsenceTypes'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'
import { ABSENCE_TYPE_CODE_ORDER, type AbsenceType } from '@/types/absence-type.types'
import { AbsenceTypeFormDialog } from '@/pages/absence-types/AbsenceTypeFormDialog'

export function AbsenceTypesPage() {
  const { t } = useTranslation()
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const canUpdate = hasAnyPermission([PERMISSIONS.ABSENCE_TYPE_UPDATE])

  const [editingType, setEditingType] = useState<AbsenceType | undefined>(undefined)

  // isDefault filters out any legacy leftover entries from before this fixed
  // 4-type model — this page only ever shows the four standard types.
  const absenceTypesQuery = useAbsenceTypes({ pageSize: 100 })
  const absenceTypes = useMemo(() => {
    const defaults = (absenceTypesQuery.data?.items ?? []).filter((type) => type.isDefault)
    return [...defaults].sort(
      (a, b) => ABSENCE_TYPE_CODE_ORDER.indexOf(a.code) - ABSENCE_TYPE_CODE_ORDER.indexOf(b.code),
    )
  }, [absenceTypesQuery.data])

  return (
    <div>
      <PageHeader title={t('absenceTypes.title')} description={t('absenceTypes.description')} />

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t('common.code')}</TableHead>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                {canUpdate && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {absenceTypesQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      {t('absenceTypes.loadingTypes')}
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {absenceTypesQuery.isError && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center">
                    <p className="text-sm text-destructive">{getErrorMessage(absenceTypesQuery.error)}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void absenceTypesQuery.refetch()}>
                      {t('common.tryAgain')}
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!absenceTypesQuery.isLoading &&
                !absenceTypesQuery.isError &&
                absenceTypes.map((absenceType) => (
                  <TableRow key={absenceType.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-mono"
                        style={{ borderColor: absenceType.color, color: absenceType.color }}
                      >
                        {absenceType.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: absenceType.color }}
                          aria-hidden
                        />
                        {absenceType.name}
                      </div>
                      {absenceType.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{absenceType.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={absenceType.active ? 'success' : 'secondary'}>
                        {absenceType.active ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </TableCell>
                    {canUpdate && (
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setEditingType(absenceType)} aria-label={t('common.edit')}>
                          <Pencil />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AbsenceTypeFormDialog
        open={Boolean(editingType)}
        onOpenChange={(open) => !open && setEditingType(undefined)}
        absenceType={editingType}
      />
    </div>
  )
}
