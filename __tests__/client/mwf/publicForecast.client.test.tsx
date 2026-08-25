// The public MWF render: derived values, snapshot-driven structure, and the
// stacked view ordering.
import { MwfForecastView, MwfStackedView } from '@/components/mwf/MwfForecastView'
import type { MwfPublicForecast } from '@/services/products/mwf/source'
import { MWF_STRUCTURE } from '@/utilities/mwf/structure'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

function forecast(overrides: Partial<MwfPublicForecast> = {}): MwfPublicForecast {
  return {
    id: 1,
    issuance: 'morning',
    serviceDate: '2026-08-25',
    issuedAt: '2026-08-25T14:00:00.000Z',
    createdAt: '2026-08-25T13:00:00.000Z',
    revision: 1,
    isCorrection: false,
    body: {
      precip: { HUR: { d1: { qpf: 0.5, density: 10 } } },
      snowLevel: { olympics: { am1: { freezing: 5000, drop: 1000, mode: 'auto' } } },
      temps: { olympics: { d1: { high: 31, low: 22 } } },
      wind: { olympics: { am1: { dir: 'SW', speed: 25 } } },
      sensible: { olympics: { morning: 'Snow showers.', afternoon: 'Clearing.' } },
      discussion: { synopsis: 'A cold front arrives.', extended: 'Ridging builds.' },
    },
    config: {
      zones: [{ id: 'olympics', name: 'Olympics' }],
      points: [{ code: 'HUR', name: 'Hurricane Ridge', zone: 'olympics', lat: 1, lng: 2 }],
      extendedZoneIds: [],
    },
    structure: MWF_STRUCTURE,
    ...overrides,
  }
}

describe('MwfForecastView', () => {
  it('renders derived snow and the snow-level designation from the body', () => {
    render(<MwfForecastView forecast={forecast()} />)
    // 0.5" QPF at 10:1 density → 5" snow
    expect(screen.getByText(/5" snow/)).toBeInTheDocument()
    // Wet D1 (qpf 0.5 > 0.005) → am1 is a snow level: 5000 − 1000
    expect(screen.getByText('4000')).toBeInTheDocument()
    expect(screen.getByText('A cold front arrives.')).toBeInTheDocument()
    expect(screen.getByText(/Snow showers\./)).toBeInTheDocument()
  })

  it('labels corrections with their revision', () => {
    render(<MwfForecastView forecast={forecast({ isCorrection: true, revision: 2 })} />)
    expect(screen.getByText(/correction \(revision 2\)/)).toBeInTheDocument()
  })

  it('renders the extended outlook only for configured zones on afternoon issuances', () => {
    const pm = forecast({
      issuance: 'afternoon',
      body: {
        ...forecast().body,
        extendedSnowLevel: { olympics: { nt3: { freezing: 4500, drop: 1000, mode: 'auto' } } },
      },
      config: { ...forecast().config, extendedZoneIds: ['olympics'] },
    })
    render(<MwfForecastView forecast={pm} />)
    expect(screen.getByText('Extended snow level outlook (ft)')).toBeInTheDocument()
    expect(screen.getByText('3500')).toBeInTheDocument()
  })
})

describe('MwfStackedView', () => {
  it('renders every issuance and an empty message when there are none', () => {
    const { rerender } = render(
      <MwfStackedView forecasts={[forecast(), forecast({ id: 2, issuance: 'afternoon' })]} />,
    )
    expect(screen.getByText(/morning forecast/)).toBeInTheDocument()
    expect(screen.getByText(/afternoon forecast/)).toBeInTheDocument()
    rerender(<MwfStackedView forecasts={[]} />)
    expect(screen.getByText(/No mountain weather forecast/)).toBeInTheDocument()
  })
})
