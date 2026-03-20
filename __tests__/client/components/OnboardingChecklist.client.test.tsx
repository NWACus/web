import { OnboardingChecklist } from '@/collections/Tenants/components/OnboardingChecklist'
import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'

import type { ProvisioningStatus } from '@/collections/Tenants/components/onboardingActions'

const mockCheckStatus = jest.fn()
const mockRunProvision = jest.fn()
const mockUseDocumentInfo = jest.fn()
const mockSetProcessing = jest.fn()
const mockToastPromise = jest.fn()
const mockToastError = jest.fn()

jest.mock('@payloadcms/ui', () => ({
  useDocumentInfo: (...args: unknown[]) => mockUseDocumentInfo(...args),
  useForm: () => ({ setProcessing: mockSetProcessing }),
  toast: {
    promise: (...args: unknown[]) => mockToastPromise(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode
    onClick: () => void
    disabled: boolean
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))

jest.mock('../../../src/collections/Tenants/components/onboardingActions', () => ({
  checkProvisioningStatusAction: (...args: unknown[]) => mockCheckStatus(...args),
  runProvisionAction: (...args: unknown[]) => mockRunProvision(...args),
}))

const buildStatus = (overrides: Partial<ProvisioningStatus> = {}): ProvisioningStatus => ({
  builtInPages: { count: 0, expected: 7 },
  pages: { copied: 0, expected: 5, missing: [], skipped: [] },
  homePage: false,
  navigation: false,
  settings: { exists: false },
  theme: { brandColors: false, ogColors: false },
  ...overrides,
})

const fullyProvisioned = buildStatus({
  builtInPages: { count: 7, expected: 7 },
  pages: { copied: 5, expected: 5, missing: [], skipped: [] },
  homePage: true,
  navigation: true,
  settings: { exists: true, id: 1 },
  theme: { brandColors: true, ogColors: true },
})

const flushAsync = () => act(() => new Promise((r) => setTimeout(r, 0)))

describe('OnboardingChecklist', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDocumentInfo.mockReturnValue({ data: { id: 1 } })
    mockCheckStatus.mockResolvedValue({ status: fullyProvisioned })
  })

  describe('on load', () => {
    beforeEach(() => {
      // Make checkStatus hang so we stay in the unloaded state
      mockCheckStatus.mockReturnValue(new Promise(() => {}))
    })

    it('shows empty circles and labels', () => {
      render(<OnboardingChecklist />)

      expect(screen.getByText('Built-in pages')).toBeInTheDocument()
      expect(screen.getByText('Home page')).toBeInTheDocument()
      expect(screen.getByText('Navigation')).toBeInTheDocument()
      expect(screen.getByText('Website Settings')).toBeInTheDocument()
    })

    it('hides details and instructions', () => {
      render(<OnboardingChecklist />)

      expect(screen.queryByText('colors.css')).not.toBeInTheDocument()
      expect(screen.queryByText('centerColorMap')).not.toBeInTheDocument()
      expect(screen.queryByText('(0/7)')).not.toBeInTheDocument()
      expect(screen.queryByText('(0/5)')).not.toBeInTheDocument()
    })
  })

  describe('provisioning', () => {
    beforeEach(() => {
      mockCheckStatus.mockResolvedValue({ status: buildStatus() })
      mockRunProvision.mockReturnValue(new Promise(() => {}))
    })

    it('shows spinners', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.getAllByTestId('spinner').length).toBeGreaterThan(0)
    })

    it('hides details', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.queryByText('(0/7)')).not.toBeInTheDocument()
      expect(screen.queryByText('(0/5)')).not.toBeInTheDocument()
      expect(screen.queryByText('colors.css')).not.toBeInTheDocument()
      expect(screen.queryByText('centerColorMap')).not.toBeInTheDocument()
    })

    it('updates button text when rerunning', async () => {
      // Automated items complete but pages incomplete — needsProvisioning returns false,
      // so auto-provision doesn't run but the button shows
      const incompleteStatus = buildStatus({
        builtInPages: { count: 7, expected: 7 },
        pages: { copied: 3, expected: 5, missing: ['about-us', 'donate'], skipped: [] },
        homePage: true,
        navigation: true,
        settings: { exists: true, id: 1 },
      })
      mockCheckStatus.mockResolvedValue({ status: incompleteStatus })

      render(<OnboardingChecklist />)
      await flushAsync()

      const button = screen.getByText('Rerun Provisioning')
      expect(button).toBeInTheDocument()

      // Click rerun — provision hangs so we stay in provisioning state
      mockRunProvision.mockReturnValue(new Promise(() => {}))
      await act(async () => {
        button.click()
      })

      expect(screen.getByText('Provisioning...')).toBeInTheDocument()
      expect(screen.queryByText('Rerun Provisioning')).not.toBeInTheDocument()
    })
  })

  describe('loaded', () => {
    it('shows checkmarks when fully provisioned', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.getByText('Built-in pages')).toBeInTheDocument()
      expect(screen.getByText('Home page')).toBeInTheDocument()
      expect(screen.getByText('(7/7)')).toBeInTheDocument()
      expect(screen.getByText('(5/5)')).toBeInTheDocument()
    })

    it('shows rerun button when not fully provisioned', async () => {
      mockCheckStatus.mockResolvedValue({
        status: buildStatus({
          builtInPages: { count: 7, expected: 7 },
          pages: { copied: 3, expected: 5, missing: ['about-us', 'donate'], skipped: [] },
          homePage: true,
          navigation: true,
          settings: { exists: true, id: 1 },
        }),
      })

      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.getByText('Rerun Provisioning')).toBeInTheDocument()
    })

    it('does not show rerun button when fully provisioned', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.queryByText('Rerun Provisioning')).not.toBeInTheDocument()
    })

    it('shows theme instructions when brand colors are missing', async () => {
      mockCheckStatus.mockResolvedValue({
        status: buildStatus({
          builtInPages: { count: 7, expected: 7 },
          pages: { copied: 5, expected: 5, missing: [], skipped: [] },
          homePage: true,
          navigation: true,
          settings: { exists: true, id: 1 },
          theme: { brandColors: false, ogColors: false },
        }),
      })

      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.getByText('Add brand colors')).toBeInTheDocument()
      expect(screen.getByText('colors.css')).toBeInTheDocument()
      expect(screen.getByText('Add OG image colors')).toBeInTheDocument()
      expect(screen.getByText('centerColorMap')).toBeInTheDocument()
    })

    it('hides theme instructions when complete', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.getByText('Add brand colors')).toBeInTheDocument()
      expect(screen.queryByText('colors.css')).not.toBeInTheDocument()
      expect(screen.queryByText('centerColorMap')).not.toBeInTheDocument()
    })

    it('shows link to settings when settings exist', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      const link = screen.getByText('Update Brand Assets')
      expect(link).toBeInTheDocument()
      expect(link.closest('a')).toHaveAttribute('href', '/admin/collections/settings/1')
    })
  })
})
