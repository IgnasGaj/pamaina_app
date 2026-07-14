import { useQuery } from '@tanstack/react-query'

import { listEmployees } from '@/api/employees.api'
import { listContracts } from '@/api/contracts.api'
import { fetchAllPages } from '@/lib/fetch-all-pages'
import type { EmploymentContract } from '@/types/contract.types'
import type { Employee } from '@/types/employee.types'

export interface SchedulerEmployee {
  employee: Employee
  /** The employee's current ACTIVE contract, or null if they have none and therefore cannot receive shifts. */
  contract: EmploymentContract | null
}

async function fetchSchedulerRoster(): Promise<SchedulerEmployee[]> {
  const [employees, activeContracts] = await Promise.all([
    fetchAllPages((page) => listEmployees({ page, pageSize: 100 })),
    fetchAllPages((page) => listContracts({ page, pageSize: 100, status: 'ACTIVE' })),
  ])

  const contractByEmployeeId = new Map(activeContracts.map((contract) => [contract.employeeId, contract]))

  return employees
    .filter((employee) => employee.status !== 'ARCHIVED')
    .map((employee) => ({
      employee,
      contract: contractByEmployeeId.get(employee.id) ?? null,
    }))
}

export function useSchedulerRoster() {
  return useQuery({
    queryKey: ['scheduler', 'roster'],
    queryFn: fetchSchedulerRoster,
  })
}
