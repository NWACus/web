import type { ProvisioningStatus } from './onboardingActions'

/**
 * Returns true only when provisioning has never been run (brand new tenant).
 * Used to auto-provision on creation without auto-triggering on tenants whose
 * provisioning already completed or partially ran.
 *
 * Kept in its own file (not in onboardingActions.ts) so tests can import it
 * without pulling in the 'use server' module's Payload-config chain.
 */
export function needsProvisioning(status: ProvisioningStatus): boolean {
  return status.status === 'not_started'
}
