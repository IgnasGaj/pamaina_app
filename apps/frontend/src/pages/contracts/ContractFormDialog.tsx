import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useDepartments } from '@/hooks/useDepartments'
import { useEmployees } from '@/hooks/useEmployees'
import { useCreateContract, useUpdateContract } from '@/hooks/useContracts'
import { usePositions } from '@/hooks/usePositions'
import { getErrorMessage } from '@/lib/errors'
import { CONTRACT_STATUS_OPTIONS, CONTRACT_TYPE_OPTIONS, WORK_WEEK_OPTIONS } from '@/lib/contract-options'
import type { EmploymentContract } from '@/types/contract.types'

const NONE_VALUE = '__none__'

function isValidDateString(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime())
}

const contractSchema = z
  .object({
    employeeId: z.string().min(1, 'Employee is required'),
    departmentId: z.string(),
    positionId: z.string(),
    contractNumber: z.string().max(50).optional().or(z.literal('')),
    status: z.enum(['ACTIVE', 'ENDED', 'SUSPENDED', 'DRAFT']),
    contractType: z.enum(['PERMANENT', 'FIXED_TERM', 'SEASONAL', 'TEMPORARY', 'INTERNSHIP']),
    startDate: z.string().min(1, 'Start date is required').refine(isValidDateString, 'Enter a valid date'),
    endDate: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((value) => !value || isValidDateString(value), 'Enter a valid date'),
    probationEndDate: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((value) => !value || isValidDateString(value), 'Enter a valid date'),
    weeklyHours: z.coerce.number().positive('Must be positive').max(168),
    dailyHours: z.coerce.number().positive('Must be positive').max(24),
    fte: z.coerce.number().min(0.1, 'Must be at least 0.1').max(1.0, 'Must be at most 1.0'),
    workWeek: z.enum(['FIVE_DAY', 'SIX_DAY', 'CUSTOM']),
    vacationDaysPerYear: z.coerce.number().int().nonnegative(),
    summarizedWorkingTime: z.boolean(),
    canWorkWeekends: z.boolean(),
    canWorkHolidays: z.boolean(),
    canWorkNights: z.boolean(),
    notes: z.string().max(2000).optional().or(z.literal('')),
  })
  .refine((data) => !data.endDate || new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after the start date',
    path: ['endDate'],
  })

type ContractFormValues = z.infer<typeof contractSchema>

export function ContractFormDialog({
  open,
  onOpenChange,
  contract,
  employeeId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract?: EmploymentContract
  /** Fixes the employee when creating from the Employee Details page; hides the employee picker. */
  employeeId?: string
}) {
  const isEditing = Boolean(contract)
  const fixedEmployeeId = contract?.employeeId ?? employeeId

  const createContract = useCreateContract()
  const updateContract = useUpdateContract(contract?.id ?? '', contract?.employeeId)
  const departmentsQuery = useDepartments({ pageSize: 100 })
  const positionsQuery = usePositions({ pageSize: 100 })
  const employeesQuery = useEmployees({ pageSize: 100, status: 'ACTIVE' })

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      employeeId: '',
      departmentId: NONE_VALUE,
      positionId: NONE_VALUE,
      contractNumber: '',
      status: 'ACTIVE',
      contractType: 'PERMANENT',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      probationEndDate: '',
      weeklyHours: 40,
      dailyHours: 8,
      fte: 1.0,
      workWeek: 'FIVE_DAY',
      vacationDaysPerYear: 20,
      summarizedWorkingTime: false,
      canWorkWeekends: true,
      canWorkHolidays: false,
      canWorkNights: true,
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        employeeId: contract?.employeeId ?? fixedEmployeeId ?? '',
        departmentId: contract?.departmentId ?? NONE_VALUE,
        positionId: contract?.positionId ?? NONE_VALUE,
        contractNumber: contract?.contractNumber ?? '',
        status: contract?.status ?? 'ACTIVE',
        contractType: contract?.contractType ?? 'PERMANENT',
        startDate: contract?.startDate.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        endDate: contract?.endDate?.slice(0, 10) ?? '',
        probationEndDate: contract?.probationEndDate?.slice(0, 10) ?? '',
        weeklyHours: contract?.weeklyHours ?? 40,
        dailyHours: contract?.dailyHours ?? 8,
        fte: contract?.fte ?? 1.0,
        workWeek: contract?.workWeek ?? 'FIVE_DAY',
        vacationDaysPerYear: contract?.vacationDaysPerYear ?? 20,
        summarizedWorkingTime: contract?.summarizedWorkingTime ?? false,
        canWorkWeekends: contract?.canWorkWeekends ?? true,
        canWorkHolidays: contract?.canWorkHolidays ?? false,
        canWorkNights: contract?.canWorkNights ?? true,
        notes: contract?.notes ?? '',
      })
    }
  }, [open, contract, fixedEmployeeId, reset])

  async function onSubmit(values: ContractFormValues) {
    const departmentId = values.departmentId === NONE_VALUE ? undefined : values.departmentId
    const positionId = values.positionId === NONE_VALUE ? undefined : values.positionId

    try {
      if (isEditing && contract) {
        await updateContract.mutateAsync({
          departmentId: departmentId ?? null,
          positionId: positionId ?? null,
          contractNumber: values.contractNumber || undefined,
          status: values.status,
          contractType: values.contractType,
          startDate: values.startDate,
          endDate: values.endDate || null,
          probationEndDate: values.probationEndDate || null,
          weeklyHours: values.weeklyHours,
          dailyHours: values.dailyHours,
          fte: values.fte,
          workWeek: values.workWeek,
          vacationDaysPerYear: values.vacationDaysPerYear,
          summarizedWorkingTime: values.summarizedWorkingTime,
          canWorkWeekends: values.canWorkWeekends,
          canWorkHolidays: values.canWorkHolidays,
          canWorkNights: values.canWorkNights,
          notes: values.notes || null,
        })
        toast.success('Contract updated')
      } else {
        await createContract.mutateAsync({
          employeeId: values.employeeId,
          departmentId,
          positionId,
          contractNumber: values.contractNumber || undefined,
          status: values.status,
          contractType: values.contractType,
          startDate: values.startDate,
          endDate: values.endDate || undefined,
          probationEndDate: values.probationEndDate || undefined,
          weeklyHours: values.weeklyHours,
          dailyHours: values.dailyHours,
          fte: values.fte,
          workWeek: values.workWeek,
          vacationDaysPerYear: values.vacationDaysPerYear,
          summarizedWorkingTime: values.summarizedWorkingTime,
          canWorkWeekends: values.canWorkWeekends,
          canWorkHolidays: values.canWorkHolidays,
          canWorkNights: values.canWorkNights,
          notes: values.notes || undefined,
        })
        toast.success('Contract created')
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const isPending = createContract.isPending || updateContract.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit contract' : 'New contract'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the employment contract.'
              : 'Only one active contract is allowed per employee at a time.'}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          {!fixedEmployeeId && (
            <div className="space-y-2">
              <Label>Employee</Label>
              <Controller
                control={control}
                name="employeeId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={isEditing}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeesQuery.data?.items.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName} ({employee.employeeCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.employeeId && <p className="text-sm text-destructive">{errors.employeeId.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Department</Label>
              <Controller
                control={control}
                name="departmentId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>No department</SelectItem>
                      {departmentsQuery.data?.items.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Controller
                control={control}
                name="positionId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>No position</SelectItem>
                      {positionsQuery.data?.items.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Contract type</Label>
              <Controller
                control={control}
                name="contractType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractNumber">Contract number</Label>
              <Input id="contractNumber" placeholder="Auto-generated" {...register('contractNumber')} />
              {errors.contractNumber && (
                <p className="text-sm text-destructive">{errors.contractNumber.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="probationEndDate">Probation ends</Label>
              <Input id="probationEndDate" type="date" {...register('probationEndDate')} />
              {errors.probationEndDate && (
                <p className="text-sm text-destructive">{errors.probationEndDate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label htmlFor="weeklyHours">Weekly hours</Label>
              <Input id="weeklyHours" type="number" step="0.5" {...register('weeklyHours')} />
              {errors.weeklyHours && <p className="text-sm text-destructive">{errors.weeklyHours.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyHours">Daily hours</Label>
              <Input id="dailyHours" type="number" step="0.5" {...register('dailyHours')} />
              {errors.dailyHours && <p className="text-sm text-destructive">{errors.dailyHours.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fte">FTE</Label>
              <Input id="fte" type="number" step="0.1" min="0.1" max="1.0" {...register('fte')} />
              {errors.fte && <p className="text-sm text-destructive">{errors.fte.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vacationDaysPerYear">Vacation days</Label>
              <Input id="vacationDaysPerYear" type="number" step="1" {...register('vacationDaysPerYear')} />
              {errors.vacationDaysPerYear && (
                <p className="text-sm text-destructive">{errors.vacationDaysPerYear.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Work week</Label>
            <Controller
              control={control}
              name="workWeek"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_WEEK_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Controller
              control={control}
              name="summarizedWorkingTime"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Switch checked={field.value} onCheckedChange={field.onChange} id="summarizedWorkingTime" />
                  <Label htmlFor="summarizedWorkingTime">Summarized time</Label>
                </div>
              )}
            />
            <Controller
              control={control}
              name="canWorkWeekends"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Switch checked={field.value} onCheckedChange={field.onChange} id="canWorkWeekends" />
                  <Label htmlFor="canWorkWeekends">Weekends</Label>
                </div>
              )}
            />
            <Controller
              control={control}
              name="canWorkHolidays"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Switch checked={field.value} onCheckedChange={field.onChange} id="canWorkHolidays" />
                  <Label htmlFor="canWorkHolidays">Holidays</Label>
                </div>
              )}
            />
            <Controller
              control={control}
              name="canWorkNights"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Switch checked={field.value} onCheckedChange={field.onChange} id="canWorkNights" />
                  <Label htmlFor="canWorkNights">Nights</Label>
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" {...register('notes')} />
            {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Create contract'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
