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
  status: 'not_started',
  lastRunAt: null,
  failed: {},
  theme: { brandColors: false, ogColors: false },
  tenantCreatedAt: null,
  settings: {},
  ...overrides,
})

const completeStatus = buildStatus({
  status: 'complete',
  lastRunAt: '2026-04-15T00:00:00.000Z',
  tenantCreatedAt: '2026-03-01T00:00:00.000Z',
  theme: { brandColors: true, ogColors: true },
  settings: { id: 1 },
})

const flushAsync = () => act(() => new Promise((r) => setTimeout(r, 0)))

describe('OnboardingChecklist', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDocumentInfo.mockReturnValue({ data: { id: 1 } })
    mockCheckStatus.mockResolvedValue({ status: completeStatus })
  })

  describe('initial load', () => {
    it('shows a loading spinner before status has been fetched', () => {
      // checkStatus hangs → loaded stays false → only the spinner renders
      mockCheckStatus.mockReturnValue(new Promise(() => {}))

      render(<OnboardingChecklist />)

      expect(screen.getAllByTestId('spinner').length).toBeGreaterThan(0)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByText('Needs action')).not.toBeInTheDocument()
    })
  })

  describe('not_started (brand new tenant)', () => {
    beforeEach(() => {
      mockCheckStatus.mockResolvedValue({ status: buildStatus() })
      mockRunProvision.mockReturnValue(new Promise(() => {}))
    })

    it('auto-provisions on mount and shows spinner', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(mockRunProvision).toHaveBeenCalledWith(1)
      expect(screen.getAllByTestId('spinner').length).toBeGreaterThan(0)
    })

    it('renders placeholder items for each automated step', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.getByText('Pages')).toBeInTheDocument()
      expect(screen.getByText('Home page')).toBeInTheDocument()
      expect(screen.getByText('Navigation')).toBeInTheDocument()
      expect(screen.getByText('Website Settings')).toBeInTheDocument()
    })
  })

  describe('complete', () => {
    it('shows "Complete" header', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.getByText('Complete')).toBeInTheDocument()
    })

    it('does not show failed pages list when failedPages is empty', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.queryByText('Failed pages:')).not.toBeInTheDocument()
    })

    it('shows the last provisioned date', async () => {
      const { container } = render(<OnboardingChecklist />)
      await flushAsync()

      expect(container.textContent).toContain('Last provisioned:')
    })

    it('hides the automated placeholder checklist once complete', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.queryByText('Pages')).not.toBeInTheDocument()
      expect(screen.queryByText('Home page')).not.toBeInTheDocument()
      expect(screen.queryByText('Navigation')).not.toBeInTheDocument()
      expect(screen.queryByText('Website Settings')).not.toBeInTheDocument()
    })

    it('shows theme nag when theme is incomplete', async () => {
      mockCheckStatus.mockResolvedValue({
        status: buildStatus({
          status: 'complete',
          lastRunAt: '2026-04-15T00:00:00.000Z',
          settings: { id: 1 },
          theme: { brandColors: false, ogColors: false },
        }),
      })

      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.getByText('Add brand colors')).toBeInTheDocument()
      expect(screen.getByText('Add OG image colors')).toBeInTheDocument()
    })

    it('shows link to settings', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.getByText('Update Brand Assets')).toBeInTheDocument()
      const settingsLink = screen.getByText('Settings')
      expect(settingsLink.closest('a')).toHaveAttribute('href', '/admin/collections/settings/1')
    })

    it('shows a Rerun button', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.getByText('Rerun')).toBeInTheDocument()
    })
  })

  describe('partial', () => {
    beforeEach(() => {
      mockCheckStatus.mockResolvedValue({
        status: buildStatus({
          status: 'partial',
          lastRunAt: '2026-04-15T00:00:00.000Z',
          failed: {
            pages: { 'About Us': 'err', Donate: 'err' },
            homePage: 'Something went wrong',
          },
          theme: { brandColors: true, ogColors: true },
          settings: { id: 1 },
        }),
      })
    })

    it('shows "Failed" header', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.getByText('Failed')).toBeInTheDocument()
    })

    it('lists the failed pages', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.getByText('Missing pages:')).toBeInTheDocument()
      expect(screen.getByText('About Us')).toBeInTheDocument()
      expect(screen.getByText('Donate')).toBeInTheDocument()
    })

    it('shows a Rerun button', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.getByText('Rerun')).toBeInTheDocument()
    })
  })

  describe('in_progress', () => {
    // Matches what a mid-run page reload would see from the DB
    beforeEach(() => {
      mockCheckStatus.mockResolvedValue({
        status: buildStatus({
          status: 'in_progress',
          lastRunAt: '2026-04-22T00:00:00.000Z',
        }),
      })
    })

    it('shows placeholder items with spinners', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(screen.getByText('Pages')).toBeInTheDocument()
      expect(screen.getByText('Home page')).toBeInTheDocument()
      expect(screen.getByText('Navigation')).toBeInTheDocument()
      expect(screen.getByText('Website Settings')).toBeInTheDocument()
      expect(screen.getAllByTestId('spinner').length).toBeGreaterThan(0)
    })

    it('does not auto-provision (another run is already active)', async () => {
      render(<OnboardingChecklist />)
      await flushAsync()

      expect(mockRunProvision).not.toHaveBeenCalled()
    })
  })
})
