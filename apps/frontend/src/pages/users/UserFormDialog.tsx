import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
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
import { useRoles } from '@/hooks/useRoles'
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers'
import { getErrorMessage } from '@/lib/errors'
import type { CompanyUser } from '@/types/user.types'

type UserFormValues = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  password: string
  roleId: string
}

function useUserFormSchema(isEditing: boolean) {
  const { t } = useTranslation()
  const base = z.object({
    firstName: z.string().min(1, t('auth.validation.firstNameRequired')).max(100),
    lastName: z.string().min(1, t('auth.validation.lastNameRequired')).max(100),
    email: z.string().email(t('auth.validation.emailRequired')),
    phone: z.string().max(30).optional().or(z.literal('')),
    password: z.string().max(128),
    roleId: z.string().min(1, t('users.validation.roleRequired')),
  })
  if (isEditing) return base
  return base.superRefine((values, ctx) => {
    if (values.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('users.validation.passwordMinLength'),
        path: ['password'],
      })
    }
  })
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: CompanyUser
}) {
  const { t } = useTranslation()
  const isEditing = Boolean(user)
  const userFormSchema = useUserFormSchema(isEditing)
  const createUser = useCreateUser()
  const updateUser = useUpdateUser(user?.id ?? '')
  const rolesQuery = useRoles()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', password: '', roleId: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        password: '',
        roleId: user?.roleId ?? '',
      })
    }
  }, [open, user, reset])

  async function onSubmit(values: UserFormValues) {
    try {
      if (isEditing) {
        await updateUser.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone || undefined,
          roleId: values.roleId,
        })
        toast.success(t('users.memberUpdated'))
      } else {
        await createUser.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone || undefined,
          password: values.password,
          roleId: values.roleId,
        })
        toast.success(t('users.memberInvited'))
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const isPending = createUser.isPending || updateUser.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? t('users.editMember') : t('users.inviteMemberTitle')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('users.editMemberDescription') : t('users.createMemberDescription')}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('auth.firstName')}</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('auth.lastName')}</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('common.email')}</Label>
            <Input id="email" type="email" disabled={isEditing} {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('common.phone')}</Label>
            <Input id="phone" {...register('phone')} />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">{t('users.temporaryPassword')}</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('users.role')}</Label>
            <Controller
              control={control}
              name="roleId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('users.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    {rolesQuery.data?.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.roleId && <p className="text-sm text-destructive">{errors.roleId.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.saving') : isEditing ? t('common.saveChanges') : t('users.sendInvite')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
