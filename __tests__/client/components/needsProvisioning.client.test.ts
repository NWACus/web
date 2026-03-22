import { needsProvisioning } from '@/collections/Tenants/components/needsProvisioning'
import type { ProvisioningStatus } from '@/collections/Tenants/components/onboardingActions'

const buildStatus = (overrides: Partial<ProvisioningStatus> = {}): ProvisioningStatus => ({
  builtInPages: { count: 0, expected: 7 },
  pages: { copied: 0, expected: 5, missing: [], skipped: [] },
  homePage: false,
  navigation: false,
  settings: { exists: false },
  theme: { brandColors: false, ogColors: false },
  ...overrides,
})

describe('needsProvisioning', () => {
  it('returns true when nothing is provisioned', () => {
    expect(needsProvisioning(buildStatus())).toBe(true)
  })

  it('returns false when all automated items are complete', () => {
    expect(
      needsProvisioning(
        buildStatus({
          builtInPages: { count: 7, expected: 7 },
          homePage: true,
          navigation: true,
          settings: { exists: true },
        }),
      ),
    ).toBe(false)
  })

  it('returns false when partially provisioned (only built-in pages missing)', () => {
    expect(
      needsProvisioning(
        buildStatus({
          builtInPages: { count: 3, expected: 7 },
          homePage: true,
          navigation: true,
          settings: { exists: true },
        }),
      ),
    ).toBe(false)
  })

  it('returns false when partially provisioned (only home page missing)', () => {
    expect(
      needsProvisioning(
        buildStatus({
          builtInPages: { count: 7, expected: 7 },
          homePage: false,
          navigation: true,
          settings: { exists: true },
        }),
      ),
    ).toBe(false)
  })

  it('returns false when partially provisioned (only navigation missing)', () => {
    expect(
      needsProvisioning(
        buildStatus({
          builtInPages: { count: 7, expected: 7 },
          homePage: true,
          navigation: false,
          settings: { exists: true },
        }),
      ),
    ).toBe(false)
  })

  it('returns false when partially provisioned (only settings missing)', () => {
    expect(
      needsProvisioning(
        buildStatus({
          builtInPages: { count: 7, expected: 7 },
          homePage: true,
          navigation: true,
          settings: { exists: false },
        }),
      ),
    ).toBe(false)
  })

  it('ignores theme status (manual step)', () => {
    expect(
      needsProvisioning(
        buildStatus({
          builtInPages: { count: 7, expected: 7 },
          homePage: true,
          navigation: true,
          settings: { exists: true },
          theme: { brandColors: false, ogColors: false },
        }),
      ),
    ).toBe(false)
  })
})
