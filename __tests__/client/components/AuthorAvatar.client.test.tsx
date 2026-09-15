import { AuthorAvatar } from '@/components/AuthorAvatar'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

const mockUseTenant = jest.fn()

jest.mock('../../../src/providers/TenantProvider', () => ({
  useTenant: () => mockUseTenant(),
}))

jest.mock('../../../src/utilities/getDocumentById', () => ({
  getDocumentById: jest.fn(),
}))

// 2026-03-10 03:30 UTC is the evening of March 9 in Pacific time.
const eveningPacificPublish = '2026-03-10T03:30:00.000Z'

describe('AuthorAvatar date', () => {
  beforeEach(() => {
    mockUseTenant.mockReset()
  })

  it("shows the published date on the center's calendar, not UTC", async () => {
    mockUseTenant.mockReturnValue({ tenant: { slug: 'nwac' } })

    render(<AuthorAvatar authors={[]} date={eveningPacificPublish} showDate />)

    expect(await screen.findByText('March 9, 2026')).toBeInTheDocument()
  })

  it('uses a Mountain center calendar for a Mountain center', async () => {
    mockUseTenant.mockReturnValue({ tenant: { slug: 'snfac' } })

    // Late evening Pacific on March 9 is already March 10 in Mountain time.
    render(<AuthorAvatar authors={[]} date="2026-03-10T06:30:00.000Z" showDate />)

    expect(await screen.findByText('March 10, 2026')).toBeInTheDocument()
  })

  it('still renders a date without a tenant in context', async () => {
    mockUseTenant.mockReturnValue({ tenant: null })

    render(<AuthorAvatar authors={[]} date={eveningPacificPublish} showDate />)

    expect(await screen.findByText(/2026/)).toBeInTheDocument()
  })
})
