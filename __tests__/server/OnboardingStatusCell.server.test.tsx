import type { ProvisioningStatus } from '@/collections/Tenants/components/onboardingActions'
import type { DefaultServerCellComponentProps } from 'payload'

const mockCheckStatus = jest.fn()

jest.mock('@payloadcms/ui', () => ({
  Pill: ({
    children,
    pillStyle,
    size,
  }: {
    children: React.ReactNode
    pillStyle?: string
    size?: string
  }) => ({ type: 'Pill', props: { children, pillStyle, size } }),
}))

jest.mock('../../src/collections/Tenants/components/onboardingActions', () => ({
  checkProvisioningStatusAction: (...args: unknown[]) => mockCheckStatus(...args),
}))

// Must import after mock setup
import { OnboardingStatusCell } from '@/collections/Tenants/components/OnboardingStatusCell'

function isReactElement(value: unknown): value is React.ReactElement<{
  children: string
  pillStyle?: string
}> {
  return value !== null && typeof value === 'object' && 'props' in value
}

const buildStatus = (overrides: Partial<ProvisioningStatus> = {}): ProvisioningStatus => ({
  forecastPages: { count: 2, expected: 2, zoneCount: 2 },
  defaultBuiltInPages: { count: 5, expected: 5 },
  pages: { created: 5, expected: 5, missing: [] },
  homePage: true,
  navigation: true,
  settings: { exists: true, id: 1 },
  theme: { brandColors: true, ogColors: true },
  ...overrides,
})

const renderCell = (rowData: DefaultServerCellComponentProps['rowData']) =>
  OnboardingStatusCell({ rowData })

describe('OnboardingStatusCell', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns null when rowData has no id', async () => {
    const result = await renderCell({})
    expect(result).toBeNull()
  })

  it('returns null when status check returns an error', async () => {
    mockCheckStatus.mockResolvedValue({ error: 'Something went wrong' })
    const result = await renderCell({ id: 1 })
    expect(result).toBeNull()
  })

  describe('complete', () => {
    it('all automated and manual steps are done', async () => {
      mockCheckStatus.mockResolvedValue({ status: buildStatus() })
      const result = await renderCell({ id: 1 })

      expect(result).not.toBeNull()
      if (!isReactElement(result)) throw new Error('Expected ReactElement')
      expect(result.props.children).toBe('Complete')
      expect(result.props.pillStyle).toBeUndefined()
    })
  })

  describe('incomplete', () => {
    it('brand colors are missing', async () => {
      mockCheckStatus.mockResolvedValue({
        status: buildStatus({ theme: { brandColors: false, ogColors: true } }),
      })
      const result = await renderCell({ id: 1 })

      if (!isReactElement(result)) throw new Error('Expected ReactElement')
      expect(result.props.children).toBe('Incomplete')
      expect(result.props.pillStyle).toBe('warning')
    })

    it('OG colors are missing', async () => {
      mockCheckStatus.mockResolvedValue({
        status: buildStatus({ theme: { brandColors: true, ogColors: false } }),
      })
      const result = await renderCell({ id: 1 })

      if (!isReactElement(result)) throw new Error('Expected ReactElement')
      expect(result.props.children).toBe('Incomplete')
      expect(result.props.pillStyle).toBe('warning')
    })

    it('home page is missing', async () => {
      mockCheckStatus.mockResolvedValue({
        status: buildStatus({ homePage: false }),
      })
      const result = await renderCell({ id: 1 })

      if (!isReactElement(result)) throw new Error('Expected ReactElement')
      expect(result.props.children).toBe('Incomplete')
      expect(result.props.pillStyle).toBe('warning')
    })

    it('settings are missing', async () => {
      mockCheckStatus.mockResolvedValue({
        status: buildStatus({ settings: { exists: false } }),
      })
      const result = await renderCell({ id: 1 })

      if (!isReactElement(result)) throw new Error('Expected ReactElement')
      expect(result.props.children).toBe('Incomplete')
      expect(result.props.pillStyle).toBe('warning')
    })
  })
})
