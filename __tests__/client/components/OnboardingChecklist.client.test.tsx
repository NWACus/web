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
  forecastPages: { count: 0, expected: 2 },
  defaultBuiltInPages: { count: 0, expected: 5 },
  pages: { created: 0, expected: 5, missing: [] },
  homePage: false,
  navigation: false,
  settings: { exists: false },
  theme: { brandColors: false, ogColors: false },
  ...overrides,
})

const fullyProvisioned = buildStatus({
  forecastPages: { count: 2, expected: 2 },
  defaultBuiltInPages: { count: 5, expected: 5 },
  pages: { created: 5, expected: 5, missing: [] },
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

  describe('provisioning', () => {
    beforeEach(() => {
      mockCheckStatus.mockResolvedValue({ status: buildStatus() })
      mockRunProvision.mockReturnValue(new Promise(() => {}))
    })

    it('shows spinners while provisioning', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.getAllByTestId('spinner').length).toBeGreaterThan(0)
    })

    it('hides details while provisioning', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.queryByText('(0/2)')).not.toBeInTheDocument()
      expect(screen.queryByText('(0/5)')).not.toBeInTheDocument()
      expect(screen.queryByText('colors.css')).not.toBeInTheDocument()
      expect(screen.queryByText('centerColorMap')).not.toBeInTheDocument()
    })

    it('updates button text when rerunning', async () => {
      // Automated items complete but pages incomplete — needsProvisioning returns false,
      // so auto-provision doesn't run but the button shows
      const incompleteStatus = buildStatus({
        forecastPages: { count: 2, expected: 2 },
        defaultBuiltInPages: { count: 5, expected: 5 },
        pages: { created: 3, expected: 5, missing: ['About Us', 'Donate'] },
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
    it('shows missing pages', async () => {
      mockCheckStatus.mockResolvedValue({
        status: buildStatus({
          forecastPages: { count: 2, expected: 2 },
          defaultBuiltInPages: { count: 5, expected: 5 },
          pages: { created: 3, expected: 5, missing: ['About Us', 'Donate'] },
          homePage: true,
          navigation: true,
          settings: { exists: true, id: 1 },
        }),
      })

      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.getByText('Missing: About Us, Donate')).toBeInTheDocument()
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
