import type { ProvisioningStatus } from './onboardingActions'

/**
 * Determines whether provisioning should run based on the current status.
 * Returns true if any required automated item is missing.
 */
export function needsProvisioning(status: ProvisioningStatus): boolean {
  const { builtInPages, homePage, navigation, settings } = status
  return !(builtInPages.count >= builtInPages.expected && homePage && navigation && settings.exists)
}
