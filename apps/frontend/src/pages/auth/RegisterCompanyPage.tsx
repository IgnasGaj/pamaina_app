import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useRegisterCompany } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/errors'

function useRegisterSchema() {
  const { t } = useTranslation()
  return z
    .object({
      companyName: z.string().min(2, t('auth.validation.companyNameTooShort')).max(200),
      companyCode: z.string().max(50).optional().or(z.literal('')),
      firstName: z.string().min(1, t('auth.validation.firstNameRequired')).max(100),
      lastName: z.string().min(1, t('auth.validation.lastNameRequired')).max(100),
      email: z.string().email(t('auth.validation.emailRequired')),
      password: z
        .string()
        .min(8, t('auth.validation.passwordMinLength'))
        .max(128)
        .regex(/[a-z]/, t('auth.validation.passwordLowercase'))
        .regex(/[A-Z]/, t('auth.validation.passwordUppercase'))
        .regex(/[0-9]/, t('auth.validation.passwordNumber')),
      confirmPassword: z.string().min(1, t('auth.validation.confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.validation.passwordsDoNotMatch'),
      path: ['confirmPassword'],
    })
}

type RegisterFormValues = {
  companyName: string
  companyCode?: string
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

export function RegisterCompanyPage() {
  const { t } = useTranslation()
  const registerSchema = useRegisterSchema()
  const registerCompany = useRegisterCompany()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: '',
      companyCode: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    try {
      await registerCompany.mutateAsync({
        // The signup form only collects one email; it doubles as the
        // company's contact address and can be changed later in settings.
        company: { name: values.companyName, email: values.email, legalCode: values.companyCode || undefined },
        owner: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
        },
      })
      void navigate('/onboarding', { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            P
          </div>
          <CardTitle className="text-xl">{t('auth.registerTitle')}</CardTitle>
          <CardDescription>{t('auth.registerDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="companyName">{t('auth.companyName')}</Label>
                <Input id="companyName" {...register('companyName')} />
                {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyCode">{t('auth.companyCode')}</Label>
                <Input id="companyCode" {...register('companyCode')} />
                {errors.companyCode && <p className="text-sm text-destructive">{errors.companyCode.message}</p>}
              </div>
            </div>

            <Separator />

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
              <Label htmlFor="email">{t('auth.yourEmail')}</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
              {errors.password ? (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">{t('auth.passwordHint')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
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
            <Button type="submit" className="w-full" disabled={registerCompany.isPending}>
              {registerCompany.isPending ? t('auth.creatingWorkspace') : t('auth.createCompany')}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              {t('auth.signIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
