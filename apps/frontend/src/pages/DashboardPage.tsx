import { Building2, Briefcase, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDepartments } from '@/hooks/useDepartments'
import { useEmployees } from '@/hooks/useEmployees'
import { usePositions } from '@/hooks/usePositions'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'

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
  const user = useAuthStore((state) => state.user)
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)

  const canReadEmployees = hasAnyPermission([PERMISSIONS.EMPLOYEE_READ])
  const canReadDepartments = hasAnyPermission([PERMISSIONS.DEPARTMENT_READ])
  const canReadPositions = hasAnyPermission([PERMISSIONS.POSITION_READ])

  const employeesQuery = useEmployees({ pageSize: 5 })
  const departmentsQuery = useDepartments({ pageSize: 1 })
  const positionsQuery = usePositions({ pageSize: 1 })

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? ''}`}
        description="Here's a snapshot of your workforce."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {canReadEmployees && (
          <StatCard
            label="Active employees"
            value={employeesQuery.data?.meta.totalItems}
            icon={Users}
            isLoading={employeesQuery.isLoading}
          />
        )}
        {canReadDepartments && (
          <StatCard
            label="Departments"
            value={departmentsQuery.data?.meta.totalItems}
            icon={Building2}
            isLoading={departmentsQuery.isLoading}
          />
        )}
        {canReadPositions && (
          <StatCard
            label="Positions"
            value={positionsQuery.data?.meta.totalItems}
            icon={Briefcase}
            isLoading={positionsQuery.isLoading}
          />
        )}
      </div>

      {canReadEmployees && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Recently added employees</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableCell>{employee.departmentName ?? '—'}</TableCell>
                    <TableCell>{employee.positionTitle ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={employee.employmentStatus === 'ACTIVE' ? 'success' : 'secondary'}>
                        {employee.employmentStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {employeesQuery.data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                      No employees yet.
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
