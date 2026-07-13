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
import { useDepartments } from '@/hooks/useDepartments'
import { useCreateEmployee, useUpdateEmployee } from '@/hooks/useEmployees'
import { usePositions } from '@/hooks/usePositions'
import { getErrorMessage } from '@/lib/errors'
import type { Employee, EmployeeStatus, EmploymentStatus, EmploymentType } from '@/types/employee.types'

const NONE_VALUE = '__none__'

const EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN']
const EMPLOYMENT_STATUSES: EmploymentStatus[] = ['ACTIVE', 'ON_LEAVE', 'TERMINATED']
const EDITABLE_STATUSES: Extract<EmployeeStatus, 'ACTIVE' | 'INACTIVE'>[] = ['ACTIVE', 'INACTIVE']

function isValidDateString(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime())
}

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z
    .string()
    .max(30)
    .regex(/^[0-9+()\-\s]*$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  personalCode: z.string().max(50).optional().or(z.literal('')),
  birthDate: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || isValidDateString(value), 'Enter a valid date'),
  departmentId: z.string(),
  positionId: z.string(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN']),
  employmentStatus: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED']),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  contractedWeeklyHours: z.coerce.number().positive('Must be positive').max(168),
  hireDate: z
    .string()
    .min(1, 'Hire date is required')
    .refine(isValidDateString, 'Enter a valid date'),
})

type EmployeeFormValues = z.infer<typeof employeeSchema>

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: Employee
}) {
  const isEditing = Boolean(employee)
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee(employee?.id ?? '')
  const departmentsQuery = useDepartments({ pageSize: 100 })
  const positionsQuery = usePositions({ pageSize: 100 })

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      personalCode: '',
      birthDate: '',
      departmentId: NONE_VALUE,
      positionId: NONE_VALUE,
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      status: 'ACTIVE',
      contractedWeeklyHours: 40,
      hireDate: new Date().toISOString().slice(0, 10),
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        firstName: employee?.firstName ?? '',
        lastName: employee?.lastName ?? '',
        email: employee?.email ?? '',
        phone: employee?.phone ?? '',
        personalCode: employee?.personalCode ?? '',
        birthDate: employee?.birthDate?.slice(0, 10) ?? '',
        departmentId: employee?.departmentId ?? NONE_VALUE,
        positionId: employee?.positionId ?? NONE_VALUE,
        employmentType: employee?.employmentType ?? 'FULL_TIME',
        employmentStatus: employee?.employmentStatus ?? 'ACTIVE',
        status: employee?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        contractedWeeklyHours: employee?.contractedWeeklyHours ?? 40,
        hireDate: employee?.hireDate.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      })
    }
  }, [open, employee, reset])

  async function onSubmit(values: EmployeeFormValues) {
    const departmentId = values.departmentId === NONE_VALUE ? undefined : values.departmentId
    const positionId = values.positionId === NONE_VALUE ? undefined : values.positionId

    try {
      if (isEditing) {
        await updateEmployee.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email || null,
          phone: values.phone || null,
          personalCode: values.personalCode || null,
          birthDate: values.birthDate || null,
          departmentId: departmentId ?? null,
          positionId: positionId ?? null,
          employmentType: values.employmentType,
          employmentStatus: values.employmentStatus,
          status: values.status,
          contractedWeeklyHours: values.contractedWeeklyHours,
        })
        toast.success('Employee updated')
      } else {
        await createEmployee.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email || undefined,
          phone: values.phone || undefined,
          personalCode: values.personalCode || undefined,
          birthDate: values.birthDate || undefined,
          departmentId,
          positionId,
          employmentType: values.employmentType,
          contractedWeeklyHours: values.contractedWeeklyHours,
          hireDate: values.hireDate,
        })
        toast.success('Employee created')
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const isPending = createEmployee.isPending || updateEmployee.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit employee' : 'New employee'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the employee record.' : 'Add a new employee to your company.'}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="personalCode">Personal code</Label>
              <Input id="personalCode" {...register('personalCode')} />
              {errors.personalCode && <p className="text-sm text-destructive">{errors.personalCode.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth date</Label>
              <Input id="birthDate" type="date" {...register('birthDate')} />
              {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate.message}</p>}
            </div>
          </div>

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
              <Label>Employment type</Label>
              <Controller
                control={control}
                name="employmentType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label>Employment status</Label>
                <Controller
                  control={control}
                  name="employmentStatus"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="contractedWeeklyHours">Weekly hours</Label>
              <Input
                id="contractedWeeklyHours"
                type="number"
                step="0.5"
                {...register('contractedWeeklyHours')}
              />
              {errors.contractedWeeklyHours && (
                <p className="text-sm text-destructive">{errors.contractedWeeklyHours.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire date</Label>
                <Input id="hireDate" type="date" {...register('hireDate')} />
                {errors.hireDate && <p className="text-sm text-destructive">{errors.hireDate.message}</p>}
              </div>
            )}

            {isEditing && (
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
                        {EDITABLE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Create employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
