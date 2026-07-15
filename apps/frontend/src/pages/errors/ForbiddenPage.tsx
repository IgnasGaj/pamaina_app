import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

export function ForbiddenPage() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <p className="text-sm font-medium text-destructive">{t('errors.forbiddenCode')}</p>
      <h1 className="text-2xl font-semibold tracking-tight">{t('errors.forbiddenTitle')}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t('errors.forbiddenDescription')}</p>
      <Button asChild className="mt-2">
        <Link to="/">{t('errors.backToDashboard')}</Link>
      </Button>
    </div>
  )
}
