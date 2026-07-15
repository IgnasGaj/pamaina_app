import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChangePassword, useLogin } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth.store'
import { getErrorMessage } from '@/lib/errors'

function useChangePasswordSchema() {
  const { t } = useTranslation()
  return z
    .object({
      currentPassword: z.string().min(1, t('auth.validation.currentPasswordRequired')),
      newPassword: z.string().min(8, t('auth.validation.passwordMinLength')).max(128),
      confirmPassword: z.string().min(1, t('auth.validation.confirmPasswordRequired')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('auth.validation.passwordsDoNotMatch'),
      path: ['confirmPassword'],
    })
}

type ChangePasswordFormValues = { currentPassword: string; newPassword: string; confirmPassword: string }

/**
 * Forced first-login step for accounts still on a system-generated
 * temporary password (see RequirePasswordChange). Changing the password
 * revokes the session that was used to reach this page, so we transparently
 * re-authenticate with the new password right after, landing the user on
 * their dashboard instead of bouncing them back to the login form.
 */
export function ChangePasswordPage() {
  const { t } = useTranslation()
  const changePasswordSchema = useChangePasswordSchema()
  const user = useAuthStore((state) => state.user)
  const changePassword = useChangePassword()
  const login = useLogin()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  async function onSubmit(values: ChangePasswordFormValues) {
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      const session = await login.mutateAsync({
        email: user!.email,
        password: values.newPassword,
        rememberMe: true,
      })
      toast.success(t('auth.passwordUpdated'))
      const defaultPath = session.user.roleKey === 'EMPLOYEE' ? '/my-dashboard' : '/'
      void navigate(defaultPath, { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const isPending = changePassword.isPending || login.isPending

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            P
          </div>
          <CardTitle className="text-xl">{t('auth.changePasswordTitle')}</CardTitle>
          <CardDescription>{t('auth.changePasswordDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('auth.temporaryPassword')}</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                {...register('currentPassword')}
              />
              {errors.currentPassword && (
                <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('auth.newPassword')}</Label>
              <Input id="newPassword" type="password" autoComplete="new-password" {...register('newPassword')} />
              {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmNewPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? t('common.saving') : t('auth.saveAndContinue')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
