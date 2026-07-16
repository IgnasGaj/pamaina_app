import { Outlet } from 'react-router-dom'

import { SettingsNavRail } from '@/pages/settings/SettingsNavRail'

/**
 * Parent route element for everything under /settings. On desktop this
 * pairs a persistent section rail with the active section's content; on
 * mobile the rail collapses away entirely (see SettingsNavRail) and the
 * Nustatymai hub's card list (rendered via the index route) is the sole
 * navigation, satisfying the "simple list on mobile" requirement.
 */
export function SettingsLayout() {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <SettingsNavRail />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
