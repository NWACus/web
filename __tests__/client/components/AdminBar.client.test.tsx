import { AdminBar } from '@/components/AdminBar'
import { hasAdminSessionMarker, setAdminSessionMarker } from '@/utilities/adminSessionMarker'
import { render, screen, waitFor } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))
jest.mock('../../../src/providers/TenantProvider', () => ({
  useTenant: () => ({ tenant: { slug: 'nwac' } }),
}))
jest.mock('../../../src/utilities/tenancy/getHostnameFromTenant', () => ({
  getHostnameFromTenant: () => 'nwac.us',
}))
jest.mock('../../../src/utilities/getURL', () => ({ getURL: () => 'https://nwac.us' }))

const originalFetch = global.fetch
const mockFetch = jest.fn()

const respondWithUser = (user: { id: number; email: string } | null) =>
  mockFetch.mockResolvedValue({ json: async () => ({ user }) })

describe('AdminBar', () => {
  beforeEach(() => {
    document.cookie = 'avy-admin-session=; Path=/; Max-Age=0'
    mockFetch.mockReset()
    global.fetch = mockFetch
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  it('does not ask who is logged in for anonymous visitors', () => {
    render(<AdminBar />)

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('shows the bar when the marker is set and the session is valid', async () => {
    setAdminSessionMarker()
    respondWithUser({ id: 1, email: 'editor@nwac.us' })

    render(<AdminBar />)

    await screen.findByText('AvyFx Admin Panel')
    expect(mockFetch).toHaveBeenCalledWith('https://nwac.us/api/users/me', expect.anything())
    expect(hasAdminSessionMarker()).toBe(true)
  })

  it('clears a stale marker once the session turns out to be gone', async () => {
    setAdminSessionMarker()
    respondWithUser(null)

    render(<AdminBar />)

    await waitFor(() => expect(hasAdminSessionMarker()).toBe(false))
  })

  it('keeps the marker when the request fails', async () => {
    setAdminSessionMarker()
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockFetch.mockRejectedValue(new Error('offline'))

    render(<AdminBar />)

    await waitFor(() => expect(warn).toHaveBeenCalled())
    expect(hasAdminSessionMarker()).toBe(true)
    warn.mockRestore()
  })

  it('mounts in preview without the marker', async () => {
    respondWithUser(null)

    render(<AdminBar adminBarProps={{ preview: true }} />)

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
  })
})
