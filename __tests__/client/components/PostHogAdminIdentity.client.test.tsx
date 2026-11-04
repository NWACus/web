import { PostHogAdminIdentity } from '@/components/PostHogAdminIdentity.client'
import { render } from '@testing-library/react'
import posthog from 'posthog-js'

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: { identify: jest.fn(), register: jest.fn(), reset: jest.fn(), unregister: jest.fn() },
}))

const mockUseAuth = jest.fn()
jest.mock('@payloadcms/ui', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockUseTenantSelection = jest.fn()
jest.mock('../../../src/providers/TenantSelectionProvider/index.client', () => ({
  useTenantSelection: () => mockUseTenantSelection(),
}))

const admin = { id: 42, email: 'editor@nwac.us', name: 'Editor' }

describe('PostHogAdminIdentity', () => {
  const originalKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

  beforeEach(() => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'
    mockUseTenantSelection.mockReturnValue({ selectedTenantSlug: undefined })
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = originalKey
  })

  it('identifies the logged-in user by id and registers the selected tenant as center', () => {
    mockUseAuth.mockReturnValue({ user: admin })
    mockUseTenantSelection.mockReturnValue({ selectedTenantSlug: 'sac' })

    render(<PostHogAdminIdentity />)

    expect(posthog.identify).toHaveBeenCalledWith('42', { email: admin.email, name: admin.name })
    expect(posthog.register).toHaveBeenCalledWith({ center: 'SAC', tenant: 'sac' })
    expect(posthog.reset).not.toHaveBeenCalled()
  })

  it('clears center when no tenant is selected', () => {
    mockUseAuth.mockReturnValue({ user: admin })

    render(<PostHogAdminIdentity />)

    expect(posthog.register).not.toHaveBeenCalled()
    expect(posthog.unregister).toHaveBeenCalledWith('center')
    expect(posthog.unregister).toHaveBeenCalledWith('tenant')
  })

  it('resets the browser identity when the user logs out', () => {
    mockUseAuth.mockReturnValue({ user: admin })
    const { rerender } = render(<PostHogAdminIdentity />)

    mockUseAuth.mockReturnValue({ user: null })
    rerender(<PostHogAdminIdentity />)

    expect(posthog.reset).toHaveBeenCalledTimes(1)
  })

  it('does not reset when the page loads logged out', () => {
    mockUseAuth.mockReturnValue({ user: null })

    render(<PostHogAdminIdentity />)

    expect(posthog.identify).not.toHaveBeenCalled()
    expect(posthog.reset).not.toHaveBeenCalled()
  })

  it('does nothing without a PostHog key', () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY
    mockUseAuth.mockReturnValue({ user: admin })
    mockUseTenantSelection.mockReturnValue({ selectedTenantSlug: 'sac' })

    render(<PostHogAdminIdentity />)

    expect(posthog.identify).not.toHaveBeenCalled()
    expect(posthog.register).not.toHaveBeenCalled()
  })
})
