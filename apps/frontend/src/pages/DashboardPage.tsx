import { Briefcase, Building2, CalendarClock, ClipboardList, Settings, UserPlus, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCompany, useCompanySettings } from '@/hooks/useCompany'
import { useDepartments } from '@/hooks/useDepartments'
import { useEmployees } from '@/hooks/useEmployees'
import { usePositions } from '@/hooks/usePositions'
import { useRequests } from '@/hooks/useRequests'
import { useAbsences } from '@/hooks/useSchedules'
import { useBusinessTypeLabel } from '@/lib/company-options'
import { formatLongDate, type AppLocale } from '@/lib/date'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function QuickAction({
  to,
  label,
  icon: Icon,
}: {
  to: string
  label: string
  icon: typeof Users
}) {
  return (
    <Button asChild variant="outline" className="h-auto justify-start gap-3 py-3">
      <Link to={to}>
        <Icon className="size-4 text-primary" />
        {label}
      </Link>
    </Button>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  isLoading,
}: {
  label: string
  value: number | undefined
  icon: typeof Users
  isLoading: boolean
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{isLoading ? '—' : (value ?? 0)}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const locale: AppLocale = i18n.language === 'en' ? 'en' : 'lt'
  const user = useAuthStore((state) => state.user)
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)

  const canReadEmployees = hasAnyPermission([PERMISSIONS.EMPLOYEE_READ])
  const canReadDepartments = hasAnyPermission([PERMISSIONS.DEPARTMENT_READ])
  const canReadPositions = hasAnyPermission([PERMISSIONS.POSITION_READ])
  const canReadRequests = hasAnyPermission([PERMISSIONS.REQUEST_READ])
  const canCreateEmployees = hasAnyPermission([PERMISSIONS.EMPLOYEE_CREATE])
  const canCreateDepartments = hasAnyPermission([PERMISSIONS.DEPARTMENT_CREATE])

  const companyQuery = useCompany(user?.companyId ?? undefined)
  const companySettingsQuery = useCompanySettings(user?.companyId ?? undefined)
  const employeesQuery = useEmployees({ pageSize: 5 })
  const departmentsQuery = useDepartments({ pageSize: 1 })
  const positionsQuery = usePositions({ pageSize: 1 })

  const today = new Date()
  const todayStr = toDateOnly(today)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const pendingRequestsQuery = useRequests({ status: 'PENDING', pageSize: 1 }, { enabled: canReadRequests })
  const upcomingVacationsQuery = useRequests(
    { status: 'APPROVED', startDateFrom: todayStr, pageSize: 5 },
    { enabled: canReadRequests },
  )
  const absentTodayQuery = useAbsences({ from: todayStr, to: todayStr }, { enabled: canReadRequests })
  const absentNextWeekQuery = useAbsences(
    { from: toDateOnly(tomorrow), to: toDateOnly(weekEnd) },
    { enabled: canReadRequests },
  )

  const businessTypeLabel = useBusinessTypeLabel(companySettingsQuery.data?.businessType)

  return (
    <div>
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{t('dashboard.welcomeTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {companyQuery.data?.name ?? '—'}
              {businessTypeLabel && (
                <>
                  {' · '}
                  <Badge variant="secondary" className="align-middle">
                    {businessTypeLabel}
                  </Badge>
                </>
              )}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {canCreateEmployees && <QuickAction to="/employees" label={t('dashboard.addEmployee')} icon={UserPlus} />}
            {canCreateDepartments && (
              <QuickAction
                to="/settings/organization?tab=departments"
                label={t('dashboard.createDepartment')}
                icon={Building2}
              />
            )}
            {user?.roleKey === 'COMPANY_OWNER' && (
              <QuickAction to="/settings/company" label={t('dashboard.settings')} icon={Settings} />
            )}
          </div>
        </CardContent>
      </Card>

      <PageHeader
        title={t('dashboard.welcomeBack', { name: user?.firstName ?? '' })}
        description={t('dashboard.snapshotDescription')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {canReadEmployees && (
          <StatCard
            label={t('dashboard.activeEmployees')}
            value={employeesQuery.data?.meta.totalItems}
            icon={Users}
            isLoading={employeesQuery.isLoading}
          />
        )}
        {canReadDepartments && (
          <StatCard
            label={t('dashboard.departments')}
            value={departmentsQuery.data?.meta.totalItems}
            icon={Building2}
            isLoading={departmentsQuery.isLoading}
          />
        )}
        {canReadPositions && (
          <StatCard
            label={t('dashboard.positions')}
            value={positionsQuery.data?.meta.totalItems}
            icon={Briefcase}
            isLoading={positionsQuery.isLoading}
          />
        )}
        {canReadRequests && (
          <StatCard
            label={t('dashboard.pendingRequests')}
            value={pendingRequestsQuery.data?.meta.totalItems}
            icon={ClipboardList}
            isLoading={pendingRequestsQuery.isLoading}
          />
        )}
      </div>

      {canReadRequests && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="size-4 text-primary" />
                {t('dashboard.upcomingVacations')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingVacationsQuery.data?.items.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('dashboard.noUpcomingVacations')}</p>
              )}
              <ul className="space-y-2">
                {upcomingVacationsQuery.data?.items.map((request) => (
                  <li key={request.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{request.employeeName}</span>
                    <span className="text-muted-foreground">
                      {formatLongDate(request.startDate.slice(0, 10), locale)} –{' '}
                      {formatLongDate(request.endDate.slice(0, 10), locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('dashboard.absences')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">{t('dashboard.absentToday')}</p>
                {absentTodayQuery.data?.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t('dashboard.noOneAbsent')}</p>
                )}
                <ul className="space-y-1">
                  {absentTodayQuery.data?.map((entry) => (
                    <li key={`${entry.employeeId}-${entry.date}`} className="flex items-center gap-2 text-sm">
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: entry.absenceTypeColor }}
                      >
                        {entry.absenceTypeCode}
                      </span>
                      {entry.employeeName}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">{t('dashboard.absentNextWeek')}</p>
                {absentNextWeekQuery.data?.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t('dashboard.noOneAbsent')}</p>
                )}
                <ul className="space-y-1">
                  {absentNextWeekQuery.data?.map((entry) => (
                    <li key={`${entry.employeeId}-${entry.date}`} className="flex items-center gap-2 text-sm">
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: entry.absenceTypeColor }}
                      >
                        {entry.absenceTypeCode}
                      </span>
                      {entry.employeeName}
                      <span className="text-muted-foreground">{formatLongDate(entry.date, locale)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {canReadEmployees && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">{t('dashboard.recentlyAddedEmployees')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.code')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeesQuery.data?.items.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Link to="/employees" className="font-medium hover:underline">
                        {employee.firstName} {employee.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{employee.employeeCode}</TableCell>
                    <TableCell>
                      <Badge variant={employee.status === 'ACTIVE' ? 'success' : 'secondary'}>
                        {employee.status === 'ACTIVE' ? t('common.active') : t('common.archived')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {employeesQuery.data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                      {t('dashboard.noEmployeesYet')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
