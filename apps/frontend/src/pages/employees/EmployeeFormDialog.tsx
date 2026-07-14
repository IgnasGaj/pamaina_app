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
import { Textarea } from '@/components/ui/textarea'
import { useDepartments } from '@/hooks/useDepartments'
import { usePositions } from '@/hooks/usePositions'
import { useCreateEmployee, useUpdateEmployee } from '@/hooks/useEmployees'
import { getErrorMessage } from '@/lib/errors'
import type { Employee, EmployeeStatus, EmploymentType } from '@/types/employee.types'

const NONE_VALUE = '__none__'
const EDITABLE_STATUSES: Extract<EmployeeStatus, 'ACTIVE' | 'INACTIVE'>[] = ['ACTIVE', 'INACTIVE']
const EMPLOYMENT_TYPE_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
]

function isValidDateString(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime())
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

const employeeSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    email: z.string().email('Enter a valid email').optional().or(z.literal('')),
    phone: z
      .string()
      .max(30)
      .regex(/^[0-9+()\-\s]*$/, 'Enter a valid phone number')
      .optional()
      .or(z.literal('')),
    departmentId: z.string(),
    positionId: z.string(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME']),
    startDate: z.string().refine(isValidDateString, 'Enter a valid date'),
    endDate: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((value) => !value || isValidDateString(value), 'Enter a valid date'),
    notes: z.string().max(2000).optional().or(z.literal('')),
    status: z.enum(['ACTIVE', 'INACTIVE']),
  })
  .refine((data) => !data.endDate || new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after the start date',
    path: ['endDate'],
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
      departmentId: NONE_VALUE,
      positionId: NONE_VALUE,
      employmentType: 'FULL_TIME',
      startDate: todayDateString(),
      endDate: '',
      notes: '',
      status: 'ACTIVE',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        firstName: employee?.firstName ?? '',
        lastName: employee?.lastName ?? '',
        email: employee?.email ?? '',
        phone: employee?.phone ?? '',
        departmentId: employee?.departmentId ?? NONE_VALUE,
        positionId: employee?.positionId ?? NONE_VALUE,
        employmentType: employee?.employmentType ?? 'FULL_TIME',
        startDate: employee?.startDate?.slice(0, 10) ?? todayDateString(),
        endDate: employee?.endDate?.slice(0, 10) ?? '',
        notes: employee?.notes ?? '',
        status: employee?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
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
          departmentId: departmentId ?? null,
          positionId: positionId ?? null,
          employmentType: values.employmentType,
          startDate: values.startDate,
          endDate: values.endDate || null,
          notes: values.notes || null,
          status: values.status,
        })
        toast.success('Employee updated')
      } else {
        await createEmployee.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email || undefined,
          phone: values.phone || undefined,
          departmentId,
          positionId,
          employmentType: values.employmentType,
          startDate: values.startDate,
          endDate: values.endDate || undefined,
          notes: values.notes || undefined,
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
            {isEditing ? 'Update the employee record.' : 'Add a new employee — they will be available in the scheduler immediately.'}
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

          <div className="grid grid-cols-2 gap-3">
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
                      {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
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

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} {...register('notes')} />
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
