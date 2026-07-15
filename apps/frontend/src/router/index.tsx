import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { EmployeeShell } from '@/components/layout/EmployeeShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequireOnboarding } from '@/components/auth/RequireOnboarding'
import { RequirePasswordChange } from '@/components/auth/RequirePasswordChange'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { RequireManagerRole } from '@/components/auth/RequireManagerRole'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ChangePasswordPage } from '@/pages/auth/ChangePasswordPage'
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
import { EmployeeRequestsPage } from '@/pages/requests/EmployeeRequestsPage'
import { EmployeeDashboardPage } from '@/pages/portal/EmployeeDashboardPage'
import { MySchedulePage } from '@/pages/portal/MySchedulePage'
import { MyRequestsPage } from '@/pages/portal/MyRequestsPage'
import { MyProfilePage } from '@/pages/portal/MyProfilePage'
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
      { path: 'change-password', element: <ChangePasswordPage /> },
      {
        element: <RequirePasswordChange />,
        children: [
          {
            element: <RequireOnboarding />,
            children: [
              {
                // Every manager-only page lives behind this role wall, in
                // addition to (not instead of) its own permission gate — a few
                // permissions (SCHEDULE_READ, WORKING_TIME_READ, REQUEST_*) are
                // intentionally shared with EMPLOYEE accounts so each role can
                // reach its own scoped endpoints, but that must never translate
                // into an employee reaching a manager page directly by URL.
                element: <RequireManagerRole />,
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
                      {
                        element: <RequirePermission anyOf={[PERMISSIONS.REQUEST_MANAGE]} />,
                        children: [{ path: 'requests', element: <EmployeeRequestsPage /> }],
                      },
                      { path: 'settings/company', element: <CompanySettingsPage /> },
                    ],
                  },
                ],
              },
              {
                element: <EmployeeShell />,
                children: [
                  { path: 'my-dashboard', element: <EmployeeDashboardPage /> },
                  { path: 'my-schedule', element: <MySchedulePage /> },
                  { path: 'my-requests', element: <MyRequestsPage /> },
                  { path: 'my-profile', element: <MyProfilePage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
