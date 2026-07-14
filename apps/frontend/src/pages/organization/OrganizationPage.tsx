import { useSearchParams } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DepartmentsPage } from '@/pages/departments/DepartmentsPage'
import { PositionsPage } from '@/pages/positions/PositionsPage'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/types/auth.types'

type OrganizationTab = 'departments' | 'positions'

export function OrganizationPage() {
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const canReadDepartments = hasAnyPermission([PERMISSIONS.DEPARTMENT_READ])
  const canReadPositions = hasAnyPermission([PERMISSIONS.POSITION_READ])

  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const activeTab: OrganizationTab =
    requestedTab === 'positions' && canReadPositions
      ? 'positions'
      : canReadDepartments
        ? 'departments'
        : 'positions'

  function handleTabChange(value: string) {
    setSearchParams((params) => {
      params.set('tab', value)
      return params
    })
  }

  return (
    <div>
      <PageHeader title="Organization" description="Organize your company into departments and positions." />

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              {canReadDepartments && <TabsTrigger value="departments">Departments</TabsTrigger>}
              {canReadPositions && <TabsTrigger value="positions">Positions</TabsTrigger>}
            </TabsList>
            {canReadDepartments && (
              <TabsContent value="departments" className="mt-4">
                <DepartmentsPage />
              </TabsContent>
            )}
            {canReadPositions && (
              <TabsContent value="positions" className="mt-4">
                <PositionsPage />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
