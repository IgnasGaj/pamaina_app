import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChangePassword } from '@/hooks/useAuth'
import { useOwnEmployeeProfile, useUpdateOwnEmployeeProfile } from '@/hooks/useEmployees'
import { getErrorMessage } from '@/lib/errors'

const contactSchema = z.object({
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z
    .string()
    .max(30)
    .regex(/^[0-9+()\-\s]*$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
})
type ContactFormValues = z.infer<typeof contactSchema>

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type PasswordFormValues = z.infer<typeof passwordSchema>

export function MyProfilePage() {
  const profileQuery = useOwnEmployeeProfile()
  const updateProfile = useUpdateOwnEmployeeProfile()
  const changePassword = useChangePassword()
  const navigate = useNavigate()

  const contactForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { email: '', phone: '' },
  })

  useEffect(() => {
    if (profileQuery.data) {
      contactForm.reset({ email: profileQuery.data.email ?? '', phone: profileQuery.data.phone ?? '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.data])

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  async function onSubmitContact(values: ContactFormValues) {
    try {
      await updateProfile.mutateAsync({ email: values.email || null, phone: values.phone || null })
      toast.success('Profile updated')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function onSubmitPassword(values: PasswordFormValues) {
    try {
      await changePassword.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword })
      toast.success('Password changed. Please sign in again.')
      void navigate('/login', { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const employee = profileQuery.data

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">My profile</h1>
        <p className="text-sm text-muted-foreground">
          {employee ? `${employee.firstName} ${employee.lastName} · ${employee.employeeCode}` : 'Loading…'}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Contact info</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={(e) => void contactForm.handleSubmit(onSubmitContact)(e)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...contactForm.register('email')} />
              {contactForm.formState.errors.email && (
                <p className="text-sm text-destructive">{contactForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...contactForm.register('phone')} />
              {contactForm.formState.errors.phone && (
                <p className="text-sm text-destructive">{contactForm.formState.errors.phone.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={(e) => void passwordForm.handleSubmit(onSubmitPassword)(e)}>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Changing…' : 'Change password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
