import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createContract,
  endContract,
  getContract,
  listContracts,
  listContractsForEmployee,
  updateContract,
} from '@/api/contracts.api'
import { employeeKeys } from '@/hooks/useEmployees'
import type { CreateContractPayload, EndContractPayload, ListContractsQuery, UpdateContractPayload } from '@/types/contract.types'

export const contractKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractKeys.all, 'list'] as const,
  list: (query: ListContractsQuery) => [...contractKeys.lists(), query] as const,
  details: () => [...contractKeys.all, 'detail'] as const,
  detail: (id: string) => [...contractKeys.details(), id] as const,
  forEmployee: (employeeId: string) => [...contractKeys.all, 'byEmployee', employeeId] as const,
}

export function useContracts(query: ListContractsQuery = {}) {
  return useQuery({
    queryKey: contractKeys.list(query),
    queryFn: () => listContracts(query),
  })
}

export function useContract(id: string | undefined) {
  return useQuery({
    queryKey: contractKeys.detail(id ?? ''),
    queryFn: () => getContract(id as string),
    enabled: Boolean(id),
  })
}

export function useEmployeeContracts(employeeId: string | undefined) {
  return useQuery({
    queryKey: contractKeys.forEmployee(employeeId ?? ''),
    queryFn: () => listContractsForEmployee(employeeId as string),
    enabled: Boolean(employeeId),
  })
}

function invalidateForEmployee(queryClient: ReturnType<typeof useQueryClient>, employeeId: string | undefined) {
  void queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
  if (employeeId) {
    void queryClient.invalidateQueries({ queryKey: contractKeys.forEmployee(employeeId) })
    void queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) })
  }
}

export function useCreateContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateContractPayload) => createContract(payload),
    onSuccess: (data) => {
      invalidateForEmployee(queryClient, data.employeeId)
    },
  })
}

export function useUpdateContract(id: string, employeeId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateContractPayload) => updateContract(id, payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: contractKeys.detail(id) })
      invalidateForEmployee(queryClient, data.employeeId ?? employeeId)
    },
  })
}

export function useEndContract(id: string, employeeId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EndContractPayload = {}) => endContract(id, payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: contractKeys.detail(id) })
      invalidateForEmployee(queryClient, data.employeeId ?? employeeId)
    },
  })
}
