import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/layout/PageHeader'
import { isNavEntryVisible } from '@/components/layout/nav-items'
import { SETTINGS_SECTIONS } from '@/components/layout/settings-sections'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth.store'

/**
 * The Nustatymai control center: every configuration module Pamaina has,
 * grouped into one place instead of cluttering the main sidebar. Doubles as
 * the mobile navigation (a plain vertical list) and as the desktop landing
 * content next to SettingsNavRail.
 */
export function SettingsPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)

  const visibleSections = SETTINGS_SECTIONS.filter((section) => isNavEntryVisible(section, user, hasAnyPermission))

  return (
    <div>
      <PageHeader title={t('settings.hubTitle')} description={t('settings.hubDescription')} />

      <div className="flex flex-col gap-3">
        {visibleSections.map((section) => (
          <Link key={section.to} to={section.to}>
            <Card className="flex-row items-center gap-4 py-4 px-5 transition-colors hover:border-primary/40 hover:bg-accent/50">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <section.icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{t(section.titleKey)}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{t(section.descriptionKey)}</p>
                {section.tagKeys && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {section.tagKeys.map((tagKey) => (
                      <Badge key={tagKey} variant="secondary">
                        {t(tagKey)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
