import { ValidityBanner } from '@/components/forecast/ValidityBanner'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

const TZ = 'America/Los_Angeles'

describe('ValidityBanner', () => {
  it('shows an archived notice on a dated/history view', () => {
    render(
      <ValidityBanner
        forecast={{ published_time: '2026-01-10T01:00:00+00:00', expires_time: null }}
        timezone={TZ}
        selectedDate="2026-01-09"
      />,
    )
    expect(screen.getByText(/archived forecast/i)).toBeInTheDocument()
  })

  it('warns when a live forecast has expired', () => {
    render(
      <ValidityBanner
        forecast={{
          published_time: '2020-01-01T00:00:00+00:00',
          expires_time: '2020-01-02T00:00:00+00:00',
        }}
        timezone={TZ}
        selectedDate={null}
      />,
    )
    expect(screen.getByText(/expired on/i)).toBeInTheDocument()
  })

  it('renders nothing for a current, unexpired live forecast', () => {
    const { container } = render(
      <ValidityBanner
        forecast={{
          published_time: '2099-01-01T00:00:00+00:00',
          expires_time: '2099-01-02T00:00:00+00:00',
        }}
        timezone={TZ}
        selectedDate={null}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
