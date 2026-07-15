import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChangePassword } from '@/hooks/useAuth'
import { useOwnEmployeeProfile, useUpdateOwnEmployeeProfile } from '@/hooks/useEmployees'
import { getErrorMessage } from '@/lib/errors'

type ContactFormValues = { email?: string; phone?: string }
type PasswordFormValues = { currentPassword: string; newPassword: string; confirmPassword: string }

function useContactSchema() {
  const { t } = useTranslation()
  return z.object({
    email: z.string().email(t('auth.validation.emailRequired')).optional().or(z.literal('')),
    phone: z
      .string()
      .max(30)
      .regex(/^[0-9+()\-\s]*$/, 'Enter a valid phone number')
      .optional()
      .or(z.literal('')),
  })
}

function usePasswordSchema() {
  const { t } = useTranslation()
  return z
    .object({
      currentPassword: z.string().min(1, t('auth.validation.currentPasswordRequired')),
      newPassword: z.string().min(8, t('auth.validation.passwordMinLength')),
      confirmPassword: z.string().min(1, t('auth.validation.confirmPasswordRequired')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('auth.validation.passwordsDoNotMatch'),
      path: ['confirmPassword'],
    })
}

export function MyProfilePage() {
  const { t } = useTranslation()
  const contactSchema = useContactSchema()
  const passwordSchema = usePasswordSchema()
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
      toast.success(t('profile.profileUpdated'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function onSubmitPassword(values: PasswordFormValues) {
    try {
      await changePassword.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword })
      toast.success(t('profile.passwordChanged'))
      void navigate('/login', { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const employee = profileQuery.data

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t('profile.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {employee ? `${employee.firstName} ${employee.lastName} · ${employee.employeeCode}` : t('common.loading')}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('profile.contactInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={(e) => void contactForm.handleSubmit(onSubmitContact)(e)}>
            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')}</Label>
              <Input id="email" type="email" {...contactForm.register('email')} />
              {contactForm.formState.errors.email && (
                <p className="text-sm text-destructive">{contactForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('common.phone')}</Label>
              <Input id="phone" {...contactForm.register('phone')} />
              {contactForm.formState.errors.phone && (
                <p className="text-sm text-destructive">{contactForm.formState.errors.phone.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? t('common.saving') : t('profile.save')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('profile.password')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={(e) => void passwordForm.handleSubmit(onSubmitPassword)(e)}>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
              <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('auth.newPassword')}</Label>
              <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmNewPassword')}</Label>
              <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={changePassword.isPending}>
              {changePassword.isPending ? t('profile.changing') : t('profile.changePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
