import type { ProvisioningStatus } from './onboardingActions'

/**
 * Returns true only when no provisioning has ever been done (brand new tenant).
 * Used to auto-provision on creation without auto-triggering on existing incomplete tenants.
 */
export function needsProvisioning(status: ProvisioningStatus): boolean {
  const { forecastPages, defaultBuiltInPages, pages, homePage, navigation, settings } = status
  return (
    forecastPages.count === 0 &&
    defaultBuiltInPages.count === 0 &&
    pages.created === 0 &&
    !homePage &&
    !navigation &&
    !settings.exists
  )
}
