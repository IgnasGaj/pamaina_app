import { useQuery } from '@tanstack/react-query'

import { listEmployees } from '@/api/employees.api'
import { fetchAllPages } from '@/lib/fetch-all-pages'
import type { Employee } from '@/types/employee.types'

async function fetchSchedulerRoster(): Promise<Employee[]> {
  const employees = await fetchAllPages((page) => listEmployees({ page, pageSize: 100 }))
  return employees.filter((employee) => employee.status !== 'ARCHIVED')
}

export function useSchedulerRoster() {
  return useQuery({
    queryKey: ['scheduler', 'roster'],
    queryFn: fetchSchedulerRoster,
  })
}
