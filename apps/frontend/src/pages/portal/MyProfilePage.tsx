import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChangePassword, useLogout } from '@/hooks/useAuth'
import { useOwnEmployeeProfile, useUpdateOwnEmployeeProfile } from '@/hooks/useEmployees'
import { getErrorMessage } from '@/lib/errors'
import { formatLongDate, type AppLocale } from '@/lib/date'
import type { EmploymentType } from '@/types/employee.types'

type ContactFormValues = { email?: string; phone?: string }
type PasswordFormValues = { currentPassword: string; newPassword: string; confirmPassword: string }

const EMPLOYMENT_TYPE_KEYS: Record<EmploymentType, string> = {
  FULL_TIME: 'employees.fullTime',
  PART_TIME_75: 'employees.partTime75',
  PART_TIME_50: 'employees.partTime50',
  PART_TIME_25: 'employees.partTime25',
}

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

export function MyProfilePage() {
  const { t, i18n } = useTranslation()
  const locale: AppLocale = i18n.language === 'en' ? 'en' : 'lt'
  const contactSchema = useContactSchema()
  const passwordSchema = usePasswordSchema()
  const profileQuery = useOwnEmployeeProfile()
  const updateProfile = useUpdateOwnEmployeeProfile()
  const changePassword = useChangePassword()
  const logout = useLogout()
  const navigate = useNavigate()
  const [confirmingLogout, setConfirmingLogout] = useState(false)

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

  async function confirmLogout() {
    await logout.mutateAsync()
    void navigate('/login', { replace: true })
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

      {employee && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('profile.employmentInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <InfoRow label={t('employees.employeeCode')} value={employee.employeeCode} />
            <InfoRow label={t('common.department')} value={employee.departmentName ?? t('portal.noDepartment')} />
            <InfoRow label={t('common.position')} value={employee.positionTitle ?? '—'} />
            <InfoRow label={t('employees.employmentType')} value={t(EMPLOYMENT_TYPE_KEYS[employee.employmentType])} />
            <InfoRow label={t('employees.startDate')} value={formatLongDate(employee.startDate.slice(0, 10), locale)} />
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('profile.contactInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={(e) => void contactForm.handleSubmit(onSubmitContact)(e)}>
            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')}</Label>
              <Input id="email" type="email" className="h-12 text-base" {...contactForm.register('email')} />
              {contactForm.formState.errors.email && (
                <p className="text-sm text-destructive">{contactForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('common.phone')}</Label>
              <Input id="phone" className="h-12 text-base" {...contactForm.register('phone')} />
              {contactForm.formState.errors.phone && (
                <p className="text-sm text-destructive">{contactForm.formState.errors.phone.message}</p>
              )}
            </div>
            <Button type="submit" className="h-12 w-full text-base" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? t('common.saving') : t('profile.save')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('profile.password')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={(e) => void passwordForm.handleSubmit(onSubmitPassword)(e)}>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
              <Input
                id="currentPassword"
                type="password"
                className="h-12 text-base"
                {...passwordForm.register('currentPassword')}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('auth.newPassword')}</Label>
              <Input id="newPassword" type="password" className="h-12 text-base" {...passwordForm.register('newPassword')} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmNewPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                className="h-12 text-base"
                {...passwordForm.register('confirmPassword')}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="h-12 w-full text-base" disabled={changePassword.isPending}>
              {changePassword.isPending ? t('profile.changing') : t('profile.changePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button
        type="button"
        variant="outline"
        className="h-12 w-full gap-2 text-base text-destructive hover:text-destructive"
        onClick={() => setConfirmingLogout(true)}
      >
        <LogOut className="size-5" />
        {t('profile.logout')}
      </Button>

      <ConfirmDialog
        open={confirmingLogout}
        onOpenChange={setConfirmingLogout}
        title={t('profile.logoutConfirmTitle')}
        description={t('profile.logoutConfirmDescription')}
        confirmLabel={t('profile.logout')}
        isLoading={logout.isPending}
        onConfirm={() => void confirmLogout()}
      />
    </div>
  )
}
