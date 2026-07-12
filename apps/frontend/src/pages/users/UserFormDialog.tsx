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
import { useRoles } from '@/hooks/useRoles'
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers'
import { getErrorMessage } from '@/lib/errors'
import type { CompanyUser } from '@/types/user.types'

const userFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().max(30).optional().or(z.literal('')),
  password: z.string().max(128),
  roleId: z.string().min(1, 'Role is required'),
})

type UserFormValues = z.infer<typeof userFormSchema>

function buildUserFormSchema(isEditing: boolean) {
  if (isEditing) return userFormSchema
  return userFormSchema.superRefine((values, ctx) => {
    if (values.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password must be at least 8 characters',
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
  const isEditing = Boolean(user)
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
    resolver: zodResolver(buildUserFormSchema(isEditing)),
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
        toast.success('Team member updated')
      } else {
        await createUser.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone || undefined,
          password: values.password,
          roleId: values.roleId,
        })
        toast.success('Team member invited')
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
          <DialogTitle>{isEditing ? 'Edit team member' : 'Invite team member'}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update this team member's role and details." : 'Create a new user account for your company.'}
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

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" disabled={isEditing} {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register('phone')} />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">Temporary password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>Role</Label>
            <Controller
              control={control}
              name="roleId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
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
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Send invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
