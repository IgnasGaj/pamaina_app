import { Briefcase, Building2, Settings, UserPlus, Users } from 'lucide-react'
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
import { useBusinessTypeLabel } from '@/lib/company-options'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'

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
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)

  const canReadEmployees = hasAnyPermission([PERMISSIONS.EMPLOYEE_READ])
  const canReadDepartments = hasAnyPermission([PERMISSIONS.DEPARTMENT_READ])
  const canReadPositions = hasAnyPermission([PERMISSIONS.POSITION_READ])
  const canCreateEmployees = hasAnyPermission([PERMISSIONS.EMPLOYEE_CREATE])
  const canCreateDepartments = hasAnyPermission([PERMISSIONS.DEPARTMENT_CREATE])

  const companyQuery = useCompany(user?.companyId ?? undefined)
  const companySettingsQuery = useCompanySettings(user?.companyId ?? undefined)
  const employeesQuery = useEmployees({ pageSize: 5 })
  const departmentsQuery = useDepartments({ pageSize: 1 })
  const positionsQuery = usePositions({ pageSize: 1 })

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
              <QuickAction to="/organization?tab=departments" label={t('dashboard.createDepartment')} icon={Building2} />
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
      </div>

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
