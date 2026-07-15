import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCompany, useCompanySettings, useUpdateCompany, useUpdateCompanySettings } from '@/hooks/useCompany'
import { getErrorMessage } from '@/lib/errors'
import { formatLongDate, type AppLocale } from '@/lib/date'
import { TIMEZONE_OPTIONS } from '@/lib/company-options'
import { setAppLanguage } from '@/i18n'
import { useAuthStore } from '@/stores/auth.store'

/**
 * A company-wide default: PAMAINA is built for Lithuanian businesses first,
 * so this only exposes Lithuanian/English for now (see onboarding's fuller
 * LANGUAGE_OPTIONS for the future-facing list). Changing it here updates
 * every user's default UI language for the company.
 */
const LANGUAGE_CHOICES: { value: 'lt' | 'en'; labelKey: string }[] = [
  { value: 'lt', labelKey: 'settings.languageLt' },
  { value: 'en', labelKey: 'settings.languageEn' },
]

export function LocalizationSettingsPage() {
  const { t, i18n } = useTranslation()
  const locale: AppLocale = i18n.language === 'en' ? 'en' : 'lt'
  const user = useAuthStore((state) => state.user)
  const companyQuery = useCompany(user?.companyId ?? undefined)
  const settingsQuery = useCompanySettings(user?.companyId ?? undefined)
  const updateCompany = useUpdateCompany(user?.companyId ?? '')
  const updateSettings = useUpdateCompanySettings(user?.companyId ?? '')

  async function handleLanguageChange(value: string) {
    try {
      await updateSettings.mutateAsync({ preferredLanguage: value })
      setAppLanguage(value)
      toast.success(t('settings.localizationUpdated'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleTimezoneChange(value: string) {
    try {
      await updateCompany.mutateAsync({ timezone: value })
      toast.success(t('settings.localizationUpdated'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const isLoading = !companyQuery.data || !settingsQuery.data

  return (
    <div>
      <PageHeader title={t('settings.localizationTitle')} description={t('settings.localizationDescription')} />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">{t('settings.localizationTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>{t('settings.language')}</Label>
                <Select value={settingsQuery.data!.preferredLanguage} onValueChange={(v) => void handleLanguageChange(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_CHOICES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('settings.timezone')}</Label>
                <Select value={companyQuery.data!.timezone} onValueChange={(v) => void handleTimezoneChange(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('settings.dateFormat')}</Label>
                <Select value="lt" disabled>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lt">{formatLongDate(new Date().toISOString().slice(0, 10), locale)}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t('settings.dateFormatFutureNote')}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
