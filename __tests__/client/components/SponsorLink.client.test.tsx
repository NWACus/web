import { SponsorLink } from '@/blocks/Sponsors/components/SponsorLink'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const mockCapture = jest.fn()

jest.mock('../../../src/utilities/useAnalytics', () => ({
  useAnalytics: () => ({ capture: mockCapture }),
}))

const sponsor = {
  id: 7,
  name: 'Acme Outfitters',
  link: 'https://acme.example.com',
}

describe('SponsorLink', () => {
  beforeEach(() => {
    mockCapture.mockClear()
  })

  it('captures a sponsor_impression once on mount', () => {
    render(
      <SponsorLink sponsor={sponsor}>
        <span>Acme Outfitters</span>
      </SponsorLink>,
    )

    expect(mockCapture).toHaveBeenCalledTimes(1)
    expect(mockCapture).toHaveBeenCalledWith('sponsor_impression', {
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

    expect(mockCapture).toHaveBeenCalledWith('sponsor_click', {
      sponsor_id: '7',
      sponsor_name: 'Acme Outfitters',
    })
  })
})
