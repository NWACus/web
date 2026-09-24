import {
  AvalancheDetail,
  characteristics,
  impactGroups,
} from '@/components/observations/detail/AvalancheDetail'
import { DetailMessage } from '@/components/observations/detail/DetailModal'
import {
  ObservationDetail,
  observationDateLabel,
} from '@/components/observations/detail/ObservationDetail'
import {
  instabilitySigns,
  weatherReadings,
} from '@/components/observations/detail/ObservationSections'
import {
  prepareAvalancheDetail,
  prepareObservationDetail,
  submitterHtml,
} from '@/components/observations/detail/prepareDetail'
import { elevationLabel, tagLabel } from '@/components/observations/filters/FilterTags'
import { isPlainClick } from '@/components/observations/links'
import { ObservationCard } from '@/components/observations/list/ObservationCard'
import { countLine } from '@/components/observations/list/ObservationList'
import { neighboursOf, resultCount } from '@/components/observations/useViewerState'
import { avalancheCard, observationCard } from '@/services/nac/observations/cards'
import { defaultFilters } from '@/services/nac/observations/filters'
import { mapAvalanche, mapObservation } from '@/services/nac/sources/v2/observationMappers'
import {
  avalancheRecordSchema,
  observationRecordSchema,
} from '@/services/nac/types/observationSchemas'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(join(__dirname, '../../e2e/mocks/obs', name), 'utf8'))
}

const observation = mapObservation(
  observationRecordSchema.parse(fixture('observation_detail.json')),
)
const avalanche = mapAvalanche(avalancheRecordSchema.parse(fixture('avalanche_detail.json')))
const TZ = 'America/Los_Angeles'

describe('ObservationDetail', () => {
  it('renders the widget’s sections for a long-form observation', () => {
    render(<ObservationDetail detail={prepareObservationDetail(observation)} timezone={TZ} />)

    expect(screen.getByRole('heading', { name: 'Field Observation', level: 1 })).toBeVisible()
    expect(screen.getByText('Stevens Pass')).toBeVisible()
    // The scrubbed fixture's observer is named "Observer Name", as is the field.
    expect(screen.getAllByText('Observer Name')).toHaveLength(2)
    expect(screen.getByRole('heading', { name: /^Weather$/ })).toBeVisible()
    expect(
      screen.getByText('Broken (Mostly Cloudy, more than 4/8 but less than 8/8)'),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Problems' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Wind Slab' })).toBeVisible()
    // Nested avalanches come back with no zone, and their cards leave it blank.
    expect(screen.queryByText('Other')).not.toBeInTheDocument()
    // Written by a forecaster, so no "not reviewed" disclaimer.
    expect(screen.queryByText(/has not been reviewed for accuracy/)).not.toBeInTheDocument()
  })

  it('shows the disclaimer on anything a forecaster didn’t write', () => {
    const publicObservation = {
      ...observation,
      observer: { ...observation.observer, type: 'public' },
    }
    render(<ObservationDetail detail={prepareObservationDetail(publicObservation)} timezone={TZ} />)
    expect(screen.getByText(/has not been reviewed for accuracy/)).toBeVisible()
  })

  it('leaves out the advanced panels a short-form record has nothing for', () => {
    const short = {
      ...observation,
      avalanches: [],
      avalanchesSummary: null,
      weather: {
        airTemp: null,
        cloudCover: null,
        windLoading: null,
        rainElevation: null,
        recentSnowfall: null,
        snowAvailableForTransport: null,
      },
      weatherSummary: null,
      snowpackSummary: null,
      snowpackMedia: [],
      problems: [],
      problemsComments: null,
    }
    render(<ObservationDetail detail={prepareObservationDetail(short)} timezone={TZ} />)
    for (const name of [/^Avalanches$/, /^Weather$/, /^Snowpack$/, /^Problems$/]) {
      expect(screen.queryByRole('heading', { name })).not.toBeInTheDocument()
    }
  })

  it('dates a record as the widget does', () => {
    const base = { ...observation, startDate: '2026-03-15', endDate: null, timeInField: null }
    expect(observationDateLabel(base)).toBe('Mar 15, 2026')
    expect(observationDateLabel({ ...base, timeInField: { start: 7, end: 12.5 } })).toBe(
      'Mar 15, 2026 (7:00 - 12:30)',
    )
    expect(observationDateLabel({ ...base, endDate: '2026-03-16' })).toBe(
      'Mar 15, 2026 - Mar 16, 2026',
    )
    expect(
      observationDateLabel({ ...base, endDate: '2026-03-16', timeInField: { start: 7, end: 9 } }),
    ).toBe('Mar 15, 2026 (7:00) - Mar 16, 2026 (9:00)')
  })

  it('lists the signs of instability in the widget’s order', () => {
    const signs = instabilitySigns({
      avalanchesObserved: true,
      avalanchesTriggered: false,
      avalanchesCaught: true,
      cracking: true,
      crackingDescription: 'widespread',
      collapsing: false,
      collapsingDescription: null,
    })
    expect(signs.map((sign) => sign.text)).toEqual([
      'Avalanches Observed',
      'Caught in Avalanche',
      'Cracking Observed (widespread)',
    ])
  })

  it('reads a missing weather object as nothing observed', () => {
    expect(weatherReadings(null).every(([, value]) => value === null)).toBe(true)
  })
})

describe('submitterHtml', () => {
  it('keeps a plain-text submission’s line breaks, and sanitizes', () => {
    expect(submitterHtml('one\ntwo')).toBe('one<br />two')
    expect(submitterHtml('<p>kept</p><script>alert(1)</script>')).toBe('<p>kept</p>')
    expect(submitterHtml('   ')).toBeNull()
  })
})

describe('AvalancheDetail', () => {
  it('renders the notices, characteristics and disclaimer', () => {
    render(<AvalancheDetail detail={prepareAvalancheDetail(avalanche)} timezone={TZ} />)
    expect(screen.getByText('This avalanche has not been confirmed by a forecaster.')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Characteristics' })).toBeVisible()
    expect(screen.getByText('D2.5')).toBeVisible()
    expect(screen.getByText(/has not been reviewed for accuracy/)).toBeVisible()
  })

  it('shows "# Avalanches" always and every other characteristic only when set', () => {
    const rows = characteristics({ ...avalanche, number: null, slopeAngle: 0 })
    expect(rows[0]).toEqual(['# Avalanches', 1])
    expect(rows.map(([label]) => label)).not.toContain('Slope Angle')
    expect(rows).toContainEqual(['Elevation', '5500 ft'])
  })

  it('groups only the impacts a record has, with costs in dollars', () => {
    const impacts = { ...avalanche.impacts, humansCaught: 2, vehiclesDamageCost: 1500 }
    expect(impactGroups(impacts)).toEqual([
      { title: 'Human', rows: [['Caught/Carried', 2]] },
      { title: 'Vehicle', rows: [['Damage Cost', '$1500']] },
    ])
  })
})

describe('DetailMessage', () => {
  it('tells "not found" from "couldn’t load"', () => {
    const { rerender } = render(<DetailMessage status="not-found" kind="observation" />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The observation doesn’t exist or is private.',
    )
    rerender(<DetailMessage status="error" kind="avalanche" />)
    expect(screen.getByRole('alert')).toHaveTextContent('This avalanche couldn’t be loaded')
  })
})

describe('ObservationCard', () => {
  it('opens in place on a plain click and leaves a modified one to the browser', () => {
    const onOpen = jest.fn()
    render(
      <ObservationCard
        card={avalancheCard(avalanche)}
        href="/x"
        highlighted={false}
        onOpen={onOpen}
      />,
    )
    const link = screen.getByRole('link')
    fireEvent.click(link, { metaKey: true })
    expect(onOpen).not.toHaveBeenCalled()
    fireEvent.click(link)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('shows an observation’s badges and media count', () => {
    const card = observationCard(observation)
    render(<ObservationCard card={card} href="/x" highlighted={false} />)
    // Its own four photos and its avalanches' — counted only because it has photos of its own.
    expect(card.media.count).toBeGreaterThan(observation.media.length)
    expect(screen.getByRole('link')).toHaveTextContent(`${card.media.count} media`)
    expect(screen.getByText('Stevens Pass')).toBeVisible()
  })
})

describe('viewer helpers', () => {
  const data = {
    items: [observationCard(observation), { ...observationCard(observation), id: 'b' }],
    total: 60,
    pages: 3,
    page: 2,
    avalancheCount: null,
  }

  it('words the count line by what narrows the list', () => {
    expect(countLine('observation', data, { place: null, zoneCount: 0 })).toBe(
      '60 observations within map area',
    )
    expect(countLine('observation', data, { place: null, zoneCount: 1 })).toBe(
      '60 observations within selected zone',
    )
    expect(
      countLine('avalanche', { ...data, avalancheCount: 1 }, { place: 'Mazama, WA', zoneCount: 2 }),
    ).toBe('1 avalanche near Mazama, WA')
  })

  it('places an open record in the page behind it', () => {
    const status = { state: 'ready' as const, data }
    expect(neighboursOf(status, { kind: 'observation', id: 'b' }, 'observation')).toEqual({
      position: 27,
      count: 60,
      previous: observation.id,
      next: null,
    })
    expect(neighboursOf(status, { kind: 'avalanche', id: 'b' }, 'observation')).toBeNull()
    expect(resultCount('avalanche', status)).toBe(0)
    expect(resultCount('observation', { state: 'loading' })).toBeNull()
  })

  it('labels the filter tags as the widget does', () => {
    const filters = { ...defaultFilters('2026-02-20'), elevationMin: 5000, elevationMax: null }
    const context = { zones: [], centerLabel: 'SAC' }
    expect(elevationLabel(filters)).toBe('> 5,000 ft')
    expect(elevationLabel({ ...filters, elevationMin: null, elevationMax: 9000 })).toBe(
      '< 9,000 ft',
    )
    expect(tagLabel({ key: 'onlyCenter' }, filters, context)).toBe('Only SAC')
    expect(tagLabel({ key: 'observers', value: 'public' }, filters, context)).toBe('Public')
    expect(tagLabel({ key: 'zones', value: '3028' }, filters, context)).toBe('3028')
  })

  it('treats only a plain main-button click as the viewer’s own', () => {
    const click = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false }
    expect(isPlainClick(click)).toBe(true)
    expect(isPlainClick({ ...click, ctrlKey: true })).toBe(false)
    expect(isPlainClick({ ...click, button: 1 })).toBe(false)
  })
})
