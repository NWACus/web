import { needsProvisioning } from '@/collections/Tenants/components/needsProvisioning'
import type { ProvisioningStatus } from '@/collections/Tenants/components/onboardingActions'

const buildStatus = (overrides: Partial<ProvisioningStatus> = {}): ProvisioningStatus => ({
  status: 'not_started',
  lastRunAt: null,
  failed: {},
  theme: { brandColors: false, ogColors: false },
  tenantCreatedAt: null,
  settings: {},
  ...overrides,
})

describe('needsProvisioning', () => {
  it('returns true when provisioning has never been run', () => {
    expect(needsProvisioning(buildStatus({ status: 'not_started' }))).toBe(true)
  })

  it('returns false when provisioning completed', () => {
    expect(needsProvisioning(buildStatus({ status: 'complete' }))).toBe(false)
  })

  it('returns false when provisioning completed partially', () => {
    expect(
      needsProvisioning(
        buildStatus({ status: 'partial', failed: { pages: { Workshops: 'err' } } }),
      ),
    ).toBe(false)
  })

  it('ignores theme status (manual step)', () => {
    // Manual steps should never cause auto-provisioning to re-trigger
    expect(
      needsProvisioning(
        buildStatus({
          status: 'complete',
          theme: { brandColors: false, ogColors: false },
        }),
      ),
    ).toBe(false)
  })
})
