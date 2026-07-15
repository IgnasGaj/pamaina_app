import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
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
const EMPLOYEE_STATUS_KEYS: Record<'ACTIVE' | 'INACTIVE', string> = {
  ACTIVE: 'common.active',
  INACTIVE: 'common.inactive',
}
const EMPLOYMENT_TYPE_KEYS: Record<EmploymentType, string> = {
  FULL_TIME: 'employees.fullTime',
  PART_TIME_75: 'employees.partTime75',
  PART_TIME_50: 'employees.partTime50',
  PART_TIME_25: 'employees.partTime25',
}
const EMPLOYMENT_TYPE_VALUES: EmploymentType[] = ['FULL_TIME', 'PART_TIME_75', 'PART_TIME_50', 'PART_TIME_25']

function isValidDateString(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime())
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

// Creating an employee always requires a valid email — it becomes the login
// for their automatically-provisioned account. Editing still allows clearing
// it (the linked account keeps its existing login email in that case).
function useEmployeeSchema(isEditing: boolean) {
  const { t } = useTranslation()
  return z
    .object({
      firstName: z.string().min(1, t('auth.validation.firstNameRequired')).max(100),
      lastName: z.string().min(1, t('auth.validation.lastNameRequired')).max(100),
      email: isEditing
        ? z.string().email(t('auth.validation.emailRequired')).optional().or(z.literal(''))
        : z.string().email(t('auth.validation.emailRequired')),
      phone: z
        .string()
        .max(30)
        .regex(/^[0-9+()\-\s]*$/, 'Enter a valid phone number')
        .optional()
        .or(z.literal('')),
      departmentId: z.string(),
      positionId: z.string(),
      employmentType: z.enum(['FULL_TIME', 'PART_TIME_75', 'PART_TIME_50', 'PART_TIME_25']),
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
}

type EmployeeFormValues = {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  departmentId: string
  positionId: string
  employmentType: EmploymentType
  startDate: string
  endDate?: string
  notes?: string
  status: 'ACTIVE' | 'INACTIVE'
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: Employee
}) {
  const { t } = useTranslation()
  const isEditing = Boolean(employee)
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee(employee?.id ?? '')
  const departmentsQuery = useDepartments({ pageSize: 100 })
  const positionsQuery = usePositions({ pageSize: 100 })
  const [temporaryLogin, setTemporaryLogin] = useState<{ email: string; temporaryPassword: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const employeeSchema = useEmployeeSchema(isEditing)

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
      setTemporaryLogin(null)
      setCopied(false)
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
        toast.success(t('employees.employeeUpdated'))
      } else {
        // Guaranteed non-empty by buildEmployeeSchema when !isEditing.
        const email = values.email!
        const result = await createEmployee.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          email,
          phone: values.phone || undefined,
          departmentId,
          positionId,
          employmentType: values.employmentType,
          startDate: values.startDate,
          endDate: values.endDate || undefined,
          notes: values.notes || undefined,
        })
        toast.success(t('employees.employeeCreated'))
        // Show the one-time temporary login instead of closing — this is the
        // only place the plaintext password is ever available.
        setTemporaryLogin({ email: result.employee.email ?? email, temporaryPassword: result.temporaryPassword })
        return
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleCopyPassword() {
    if (!temporaryLogin) return
    await navigator.clipboard.writeText(temporaryLogin.temporaryPassword)
    setCopied(true)
    toast.success(t('employees.temporaryPasswordCopied'))
  }

  const isPending = createEmployee.isPending || updateEmployee.isPending

  if (temporaryLogin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('employees.createdSuccessTitle')}</DialogTitle>
            <DialogDescription>{t('employees.createdSuccessDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-md border bg-muted/40 p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">{t('common.email')}</p>
              <p className="font-mono text-sm">{temporaryLogin.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">{t('employees.temporaryPassword')}</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 rounded border bg-background px-2 py-1.5 font-mono text-sm">
                  {temporaryLogin.temporaryPassword}
                </p>
                <Button type="button" variant="outline" size="icon" onClick={() => void handleCopyPassword()}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t('employees.temporaryPasswordFooter')}</p>
          <DialogFooter>
            <Button type="button" onClick={() => onOpenChange(false)}>
              {t('common.done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('employees.editEmployee') : t('employees.newEmployee')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('employees.editEmployeeDescription') : t('employees.createEmployeeDescription')}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('employees.firstName')}</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('employees.lastName')}</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')}</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              ) : (
                !isEditing && <p className="text-xs text-muted-foreground">{t('employees.loginHint')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('common.phone')}</Label>
              <Input id="phone" {...register('phone')} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('employees.department')}</Label>
              <Controller
                control={control}
                name="departmentId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('employees.noDepartment')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>{t('employees.noDepartment')}</SelectItem>
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
              <Label>{t('employees.position')}</Label>
              <Controller
                control={control}
                name="positionId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('employees.noPosition')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>{t('employees.noPosition')}</SelectItem>
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
              <Label>{t('employees.employmentType')}</Label>
              <Controller
                control={control}
                name="employmentType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPE_VALUES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(EMPLOYMENT_TYPE_KEYS[value])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {isEditing && (
              <div className="space-y-2">
                <Label>{t('common.status')}</Label>
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
                            {t(EMPLOYEE_STATUS_KEYS[status])}
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
              <Label htmlFor="startDate">{t('employees.startDate')}</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t('employees.endDate')}</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('common.notes')}</Label>
            <Textarea id="notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.saving') : isEditing ? t('common.saveChanges') : t('employees.newEmployee')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
