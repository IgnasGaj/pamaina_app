import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequireOnboarding } from '@/components/auth/RequireOnboarding'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterCompanyPage } from '@/pages/auth/RegisterCompanyPage'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DepartmentsPage } from '@/pages/departments/DepartmentsPage'
import { PositionsPage } from '@/pages/positions/PositionsPage'
import { EmployeesPage } from '@/pages/employees/EmployeesPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { CompanySettingsPage } from '@/pages/settings/CompanySettingsPage'
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
                children: [{ path: 'employees', element: <EmployeesPage /> }],
              },
              {
                element: <RequirePermission anyOf={[PERMISSIONS.DEPARTMENT_READ]} />,
                children: [{ path: 'departments', element: <DepartmentsPage /> }],
              },
              {
                element: <RequirePermission anyOf={[PERMISSIONS.POSITION_READ]} />,
                children: [{ path: 'positions', element: <PositionsPage /> }],
              },
              {
                element: <RequirePermission anyOf={[PERMISSIONS.USER_READ]} />,
                children: [{ path: 'users', element: <UsersPage /> }],
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
