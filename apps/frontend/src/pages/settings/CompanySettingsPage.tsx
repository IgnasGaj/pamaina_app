import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCompany, useUpdateCompany } from '@/hooks/useCompany'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth.store'

function useCompanySchema() {
  const { t } = useTranslation()
  return z.object({
    name: z.string().min(2, t('auth.validation.companyNameTooShort')).max(200),
    email: z.string().email(t('auth.validation.emailRequired')),
    phone: z.string().max(30).optional().or(z.literal('')),
    address: z.string().max(300).optional().or(z.literal('')),
    city: z.string().max(120).optional().or(z.literal('')),
    legalCode: z.string().max(50).optional().or(z.literal('')),
    vatCode: z.string().max(50).optional().or(z.literal('')),
  })
}

type CompanyFormValues = {
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  legalCode?: string
  vatCode?: string
}

export function CompanySettingsPage() {
  const { t } = useTranslation()
  const companySchema = useCompanySchema()
  const user = useAuthStore((state) => state.user)
  const companyQuery = useCompany(user?.companyId ?? undefined)
  const updateCompany = useUpdateCompany(user?.companyId ?? '')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: '', email: '', phone: '', address: '', city: '', legalCode: '', vatCode: '' },
  })

  useEffect(() => {
    if (companyQuery.data) {
      reset({
        name: companyQuery.data.name,
        email: companyQuery.data.email,
        phone: companyQuery.data.phone ?? '',
        address: companyQuery.data.address ?? '',
        city: companyQuery.data.city ?? '',
        legalCode: companyQuery.data.legalCode ?? '',
        vatCode: companyQuery.data.vatCode ?? '',
      })
    }
  }, [companyQuery.data, reset])

  async function onSubmit(values: CompanyFormValues) {
    try {
      await updateCompany.mutateAsync({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        address: values.address || undefined,
        city: values.city || undefined,
        legalCode: values.legalCode || undefined,
        vatCode: values.vatCode || undefined,
      })
      toast.success(t('settings.companyUpdated'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader title={t('settings.companyTitle')} description={t('settings.companyDescription')} />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          {companyQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : (
            <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('settings.companyName')}</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('settings.companyEmail')}</Label>
                  <Input id="email" type="email" {...register('email')} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('common.phone')}</Label>
                  <Input id="phone" {...register('phone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{t('settings.city')}</Label>
                  <Input id="city" {...register('city')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t('settings.address')}</Label>
                <Input id="address" {...register('address')} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="legalCode">{t('settings.legalCode')}</Label>
                  <Input id="legalCode" {...register('legalCode')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vatCode">{t('settings.vatCode')}</Label>
                  <Input id="vatCode" {...register('vatCode')} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateCompany.isPending}>
                  {updateCompany.isPending ? t('common.saving') : t('common.saveChanges')}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
