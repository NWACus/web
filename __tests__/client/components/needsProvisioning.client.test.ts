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

  it('returns true when built-in pages are incomplete', () => {
    expect(
      needsProvisioning(
        buildStatus({
          builtInPages: { count: 3, expected: 7 },
          homePage: true,
          navigation: true,
          settings: { exists: true },
        }),
      ),
    ).toBe(true)
  })

  it('returns true when home page is missing', () => {
    expect(
      needsProvisioning(
        buildStatus({
          builtInPages: { count: 7, expected: 7 },
          homePage: false,
          navigation: true,
          settings: { exists: true },
        }),
      ),
    ).toBe(true)
  })

  it('returns true when navigation is missing', () => {
    expect(
      needsProvisioning(
        buildStatus({
          builtInPages: { count: 7, expected: 7 },
          homePage: true,
          navigation: false,
          settings: { exists: true },
        }),
      ),
    ).toBe(true)
  })

  it('returns true when settings are missing', () => {
    expect(
      needsProvisioning(
        buildStatus({
          builtInPages: { count: 7, expected: 7 },
          homePage: true,
          navigation: true,
          settings: { exists: false },
        }),
      ),
    ).toBe(true)
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

  it('returns false when built-in pages exceed expected count', () => {
    expect(
      needsProvisioning(
        buildStatus({
          builtInPages: { count: 10, expected: 7 },
          homePage: true,
          navigation: true,
          settings: { exists: true },
        }),
      ),
    ).toBe(false)
  })
})
