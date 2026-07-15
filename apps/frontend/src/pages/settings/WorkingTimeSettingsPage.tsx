import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCompanyNonWorkingDays, useDeleteNonWorkingDay, useHolidays } from '@/hooks/useWorkingTime'
import { getErrorMessage } from '@/lib/errors'
import { formatLongDate, type AppLocale } from '@/lib/date'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'
import type { CompanyNonWorkingDay } from '@/types/working-time.types'
import { NonWorkingDayFormDialog } from '@/pages/settings/NonWorkingDayFormDialog'

function currentYear(): number {
  return new Date().getFullYear()
}

export function WorkingTimeSettingsPage() {
  const { t, i18n } = useTranslation()
  const locale: AppLocale = i18n.language === 'en' ? 'en' : 'lt'
  const EMPLOYMENT_TYPE_ROWS = [
    { label: t('workingTime.fullTime'), fraction: '100%' },
    { label: t('workingTime.partTime'), fraction: '75%' },
    { label: t('workingTime.partTime'), fraction: '50%' },
    { label: t('workingTime.partTime'), fraction: '25%' },
  ]
  function formatDate(value: string): string {
    return formatLongDate(value, locale)
  }
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const canManage = hasAnyPermission([PERMISSIONS.WORKING_TIME_MANAGE])

  const [year, setYear] = useState(currentYear())
  const [formOpen, setFormOpen] = useState(false)
  const [deletingDay, setDeletingDay] = useState<CompanyNonWorkingDay | undefined>(undefined)

  const nonWorkingDaysQuery = useCompanyNonWorkingDays()
  const holidaysQuery = useHolidays({ year })
  const deleteNonWorkingDay = useDeleteNonWorkingDay()

  const defaultHolidays = (holidaysQuery.data ?? []).filter((holiday) => holiday.source === 'default')
  const nonWorkingDays = nonWorkingDaysQuery.data ?? []

  async function confirmDelete() {
    if (!deletingDay) return
    try {
      await deleteNonWorkingDay.mutateAsync(deletingDay.id)
      toast.success(t('workingTime.dayRemoved'))
      setDeletingDay(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader title={t('workingTime.title')} description={t('workingTime.description')} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t('workingTime.companyNonWorkingDays')}</CardTitle>
            {canManage && (
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus />
                {t('workingTime.addDay')}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">{t('workingTime.companyNonWorkingDaysDescription')}</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.date')}</TableHead>
                  <TableHead>{t('common.name')}</TableHead>
                  {canManage && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonWorkingDaysQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        {t('common.loading')}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!nonWorkingDaysQuery.isLoading && nonWorkingDays.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                      {t('workingTime.noneYet')}
                    </TableCell>
                  </TableRow>
                )}
                {nonWorkingDays.map((day) => (
                  <TableRow key={day.id}>
                    <TableCell className="text-muted-foreground">{formatDate(day.date)}</TableCell>
                    <TableCell className="font-medium">{day.name}</TableCell>
                    {canManage && (
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingDay(day)}>
                          <Trash2 />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('workingTime.employmentTypes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">{t('workingTime.employmentTypesDescription')}</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('workingTime.type')}</TableHead>
                  <TableHead>{t('workingTime.ofFullTime')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {EMPLOYMENT_TYPE_ROWS.map((row) => (
                  <TableRow key={row.fraction}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="text-muted-foreground">{row.fraction}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t('workingTime.lithuanianHolidays')}</CardTitle>
            <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => currentYear() - 1 + i).map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">{t('workingTime.officialHolidaysDescription')}</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.date')}</TableHead>
                  <TableHead>{t('common.name')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidaysQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        {t('common.loading')}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!holidaysQuery.isLoading &&
                  defaultHolidays.map((holiday) => (
                    <TableRow key={holiday.date}>
                      <TableCell className="text-muted-foreground">{formatDate(holiday.date)}</TableCell>
                      <TableCell className="font-medium">{holiday.name}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <NonWorkingDayFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={Boolean(deletingDay)}
        onOpenChange={(open) => !open && setDeletingDay(undefined)}
        title={t('workingTime.removeDay')}
        description={t('workingTime.removeDayDescription', { name: deletingDay?.name })}
        confirmLabel={t('common.remove')}
        isLoading={deleteNonWorkingDay.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
