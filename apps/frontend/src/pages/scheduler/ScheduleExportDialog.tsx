import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useDepartments } from '@/hooks/useDepartments'
import { useSchedulerRoster } from '@/hooks/useSchedulerRoster'
import { useScheduleExport } from '@/hooks/useScheduleExport'
import { useAuthStore } from '@/stores/auth.store'
import { getErrorMessage } from '@/lib/errors'
import { getMonthNames, type AppLocale } from '@/lib/date'
import type { ScheduleExportFormat } from '@/types/schedule-export.types'

const NONE_VALUE = '__all__'

export function ScheduleExportDialog({
  open,
  onOpenChange,
  format,
  year,
  month,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  format: ScheduleExportFormat
  year: number
  month: number
}) {
  const { t, i18n } = useTranslation()
  const locale: AppLocale = i18n.language === 'en' ? 'en' : 'lt'
  const monthLabels = getMonthNames(locale)
  const user = useAuthStore((state) => state.user)

  const [selectedYear, setSelectedYear] = useState(year)
  const [selectedMonth, setSelectedMonth] = useState(month)
  const [departmentId, setDepartmentId] = useState(NONE_VALUE)
  const [employeeId, setEmployeeId] = useState(NONE_VALUE)
  const [includeUnpublished, setIncludeUnpublished] = useState(false)
  const [signatureName, setSignatureName] = useState('')

  const departmentsQuery = useDepartments({ pageSize: 100 })
  const rosterQuery = useSchedulerRoster()
  const exportMutation = useScheduleExport()

  useEffect(() => {
    if (open) {
      setSelectedYear(year)
      setSelectedMonth(month)
      setDepartmentId(NONE_VALUE)
      setEmployeeId(NONE_VALUE)
      setIncludeUnpublished(false)
      setSignatureName(user ? `${user.firstName} ${user.lastName}` : '')
    }
  }, [open, year, month, user])

  const employeesInDepartment = useMemo(() => {
    const all = rosterQuery.data ?? []
    if (departmentId === NONE_VALUE) return all
    return all.filter((employee) => employee.departmentId === departmentId)
  }, [rosterQuery.data, departmentId])

  const titleKey: Record<ScheduleExportFormat, string> = {
    xlsx: 'scheduler.export.dialogTitleExcel',
    pdf: 'scheduler.export.dialogTitlePdf',
    print: 'scheduler.export.dialogTitlePrint',
  }

  async function handleExport() {
    try {
      await exportMutation.mutateAsync({
        year: selectedYear,
        month: selectedMonth,
        departmentId: departmentId === NONE_VALUE ? undefined : departmentId,
        employeeId: employeeId === NONE_VALUE ? undefined : employeeId,
        includeUnpublished,
        signatureName: signatureName || undefined,
        format,
      })
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(titleKey[format])}</DialogTitle>
          <DialogDescription>{t('scheduler.export.dialogDescription')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>{t('scheduler.export.month')}</Label>
              <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthLabels.map((label, index) => (
                    <SelectItem key={label} value={String(index + 1)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t('scheduler.export.year')}</Label>
              <Input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>{t('scheduler.export.department')}</Label>
            <Select
              value={departmentId}
              onValueChange={(value) => {
                setDepartmentId(value)
                setEmployeeId(NONE_VALUE)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>{t('scheduler.export.allDepartments')}</SelectItem>
                {departmentsQuery.data?.items.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>{t('scheduler.export.employee')}</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>{t('scheduler.export.allEmployees')}</SelectItem>
                {employeesInDepartment.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>{t('scheduler.export.signatureName')}</Label>
            <Input value={signatureName} onChange={(e) => setSignatureName(e.target.value)} />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label className="font-normal">{t('scheduler.export.includeUnpublished')}</Label>
            <Switch checked={includeUnpublished} onCheckedChange={setIncludeUnpublished} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void handleExport()} disabled={exportMutation.isPending}>
            {exportMutation.isPending ? t('common.pleaseWait') : t('scheduler.export.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
