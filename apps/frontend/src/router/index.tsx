import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequireOnboarding } from '@/components/auth/RequireOnboarding'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterCompanyPage } from '@/pages/auth/RegisterCompanyPage'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { OrganizationPage } from '@/pages/organization/OrganizationPage'
import { EmployeesPage } from '@/pages/employees/EmployeesPage'
import { EmployeeDetailsPage } from '@/pages/employees/EmployeeDetailsPage'
import { SchedulerPage } from '@/pages/scheduler/SchedulerPage'
import { ShiftTemplatesPage } from '@/pages/shift-templates/ShiftTemplatesPage'
import { AbsenceTypesPage } from '@/pages/absence-types/AbsenceTypesPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { CompanySettingsPage } from '@/pages/settings/CompanySettingsPage'
import { WorkingTimeSettingsPage } from '@/pages/settings/WorkingTimeSettingsPage'
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage'
import { NotFoundPage } from '@/pages/errors/NotFoundPage'
import { PERMISSIONS } from '@/types/auth.types'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterCompanyPage /> },
  { path: '/403', element: <ForbiddenPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: 'onboarding', element: <OnboardingPage /> },
      {
        element: <RequireOnboarding />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <DashboardPage /> },
              {
                element: <RequirePermission anyOf={[PERMISSIONS.EMPLOYEE_READ]} />,
                children: [
                  { path: 'employees', element: <EmployeesPage /> },
                  { path: 'employees/:id', element: <EmployeeDetailsPage /> },
                ],
              },
              {
                element: <RequirePermission anyOf={[PERMISSIONS.SCHEDULE_READ]} />,
                children: [{ path: 'scheduler', element: <SchedulerPage /> }],
              },
              {
                element: <RequirePermission anyOf={[PERMISSIONS.SHIFT_TEMPLATE_READ]} />,
                children: [{ path: 'shift-templates', element: <ShiftTemplatesPage /> }],
              },
              {
                element: <RequirePermission anyOf={[PERMISSIONS.ABSENCE_TYPE_READ]} />,
                children: [{ path: 'absence-types', element: <AbsenceTypesPage /> }],
              },
              {
                element: (
                  <RequirePermission anyOf={[PERMISSIONS.DEPARTMENT_READ, PERMISSIONS.POSITION_READ]} />
                ),
                children: [{ path: 'organization', element: <OrganizationPage /> }],
              },
              {
                element: <RequirePermission anyOf={[PERMISSIONS.USER_READ]} />,
                children: [{ path: 'users', element: <UsersPage /> }],
              },
              {
                element: <RequirePermission anyOf={[PERMISSIONS.WORKING_TIME_READ]} />,
                children: [{ path: 'settings/working-time', element: <WorkingTimeSettingsPage /> }],
              },
              { path: 'settings/company', element: <CompanySettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
