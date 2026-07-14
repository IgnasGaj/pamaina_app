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
import { useCreateEmployee, useUpdateEmployee } from '@/hooks/useEmployees'
import { getErrorMessage } from '@/lib/errors'
import type { Employee, EmployeeStatus } from '@/types/employee.types'

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
  status: z.enum(['ACTIVE', 'INACTIVE']),
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
        personalCode: employee?.personalCode ?? '',
        birthDate: employee?.birthDate?.slice(0, 10) ?? '',
        status: employee?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      })
    }
  }, [open, employee, reset])

  async function onSubmit(values: EmployeeFormValues) {
    try {
      if (isEditing) {
        await updateEmployee.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email || null,
          phone: values.phone || null,
          personalCode: values.personalCode || null,
          birthDate: values.birthDate || null,
          status: values.status,
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

          {isEditing && (
            <div className="grid grid-cols-2 gap-3">
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
            </div>
          )}

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
