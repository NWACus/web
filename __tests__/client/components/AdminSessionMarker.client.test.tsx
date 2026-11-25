import { AdminSessionMarker } from '@/components/AdminSessionMarker.client'
import { hasAdminSessionMarker, setAdminSessionMarker } from '@/utilities/adminSessionMarker'
import { render } from '@testing-library/react'

const mockUseAuth = jest.fn()
jest.mock('@payloadcms/ui', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('AdminSessionMarker', () => {
  beforeEach(() => {
    document.cookie = 'avy-admin-session=; Path=/; Max-Age=0'
  })

  it('sets the marker for a logged-in user and clears it on logout', () => {
    mockUseAuth.mockReturnValue({ user: { id: 42 } })
    const { rerender } = render(<AdminSessionMarker />)
    expect(hasAdminSessionMarker()).toBe(true)

    mockUseAuth.mockReturnValue({ user: null })
    rerender(<AdminSessionMarker />)
    expect(hasAdminSessionMarker()).toBe(false)
  })

  it('leaves the marker alone while the user is unknown', () => {
    setAdminSessionMarker()
    mockUseAuth.mockReturnValue({ user: undefined })

    render(<AdminSessionMarker />)

    expect(hasAdminSessionMarker()).toBe(true)
  })
})
