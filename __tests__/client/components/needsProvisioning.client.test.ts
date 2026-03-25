import { needsProvisioning } from '@/collections/Tenants/components/needsProvisioning'
import type { ProvisioningStatus } from '@/collections/Tenants/components/onboardingActions'

const buildStatus = (overrides: Partial<ProvisioningStatus> = {}): ProvisioningStatus => ({
  forecastPages: { count: 0, expected: 2, zoneCount: 0 },
  defaultBuiltInPages: { count: 0, expected: 5 },
  pages: { created: 0, expected: 5, missing: [] },
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
          forecastPages: { count: 2, expected: 2, zoneCount: 2 },
          defaultBuiltInPages: { count: 5, expected: 5 },
          pages: { created: 5, expected: 5, missing: [] },
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
          forecastPages: { count: 1, expected: 2, zoneCount: 2 },
          defaultBuiltInPages: { count: 2, expected: 5 },
          pages: { created: 5, expected: 5, missing: [] },
          homePage: true,
          navigation: true,
          settings: { exists: true },
        }),
      ),
    ).toBe(false)
  })

  it('returns false when partially provisioned (only pages missing)', () => {
    expect(
      needsProvisioning(
        buildStatus({
          forecastPages: { count: 2, expected: 2, zoneCount: 2 },
          defaultBuiltInPages: { count: 5, expected: 5 },
          pages: { created: 3, expected: 5, missing: ['About Us', 'Donate'] },
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
          forecastPages: { count: 2, expected: 2, zoneCount: 2 },
          defaultBuiltInPages: { count: 5, expected: 5 },
          pages: { created: 5, expected: 5, missing: [] },
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
          forecastPages: { count: 2, expected: 2, zoneCount: 2 },
          defaultBuiltInPages: { count: 5, expected: 5 },
          pages: { created: 5, expected: 5, missing: [] },
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
          forecastPages: { count: 2, expected: 2, zoneCount: 2 },
          defaultBuiltInPages: { count: 5, expected: 5 },
          pages: { created: 5, expected: 5, missing: [] },
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
          forecastPages: { count: 2, expected: 2, zoneCount: 2 },
          defaultBuiltInPages: { count: 5, expected: 5 },
          homePage: true,
          navigation: true,
          settings: { exists: true },
          theme: { brandColors: false, ogColors: false },
        }),
      ),
    ).toBe(false)
  })
})
