import { SponsorLink } from '@/blocks/Sponsors/components/SponsorLink'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const mockCaptureWithTenant = jest.fn()

jest.mock('../../../src/utilities/useAnalytics', () => ({
  useAnalytics: () => ({ captureWithTenant: mockCaptureWithTenant }),
}))

const sponsor = {
  id: 7,
  name: 'Acme Outfitters',
  link: 'https://acme.example.com',
}

describe('SponsorLink', () => {
  beforeEach(() => {
    mockCaptureWithTenant.mockClear()
  })

  it('captures a sponsor_impression once on mount', () => {
    render(
      <SponsorLink sponsor={sponsor}>
        <span>Acme Outfitters</span>
      </SponsorLink>,
    )

    expect(mockCaptureWithTenant).toHaveBeenCalledTimes(1)
    expect(mockCaptureWithTenant).toHaveBeenCalledWith('sponsor_impression', {
      sponsor_id: '7',
      sponsor_name: 'Acme Outfitters',
    })
  })

  it('captures a sponsor_click when the link is clicked', () => {
    render(
      <SponsorLink sponsor={sponsor}>
        <span>Acme Outfitters</span>
      </SponsorLink>,
    )

    fireEvent.click(screen.getByRole('link'))

    expect(mockCaptureWithTenant).toHaveBeenCalledWith('sponsor_click', {
      sponsor_id: '7',
      sponsor_name: 'Acme Outfitters',
    })
  })
})
