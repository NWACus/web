// jsdom can't navigate: a click runs `onNavigate` alone, as the router's would.
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    onNavigate,
    children,
  }: {
    href: string
    onNavigate?: () => void
    children: React.ReactNode
  }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault()
        onNavigate?.()
      }}
    >
      {children}
    </a>
  ),
}))

import { WidgetZoneWeather } from '@/components/NWACWeather/WidgetZoneWeather.client'
import { ZoneWeatherLink } from '@/components/NWACWeather/ZoneWeatherLink.client'
import { mapV3NWACWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type React from 'react'
import fixture from '../../server/fixtures/nwac-weather-forecasts.json'

const mapped = mapV3NWACWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
if (!mapped) throw new Error('fixture should map to a forecast day')
const day = {
  ...mapped,
  windows: [{ startsAt: '2026-09-15T01:00:00.000Z', issuance: 0, periodKeys: ['n1', 'd2'] }],
}
const OLYMPICS = 1645

function renderInWidget() {
  return render(
    <>
      <div id="nac-additional-content" />
      <div className="nac-tabPane">
        <div id="nac-weather-forecast">The content could not be loaded.</div>
      </div>
      <WidgetZoneWeather center="nwac" timezone="America/Los_Angeles" />
    </>,
  )
}

function fireNacLoaded(detail: Record<string, unknown>) {
  act(() => {
    window.dispatchEvent(new CustomEvent('nac-loaded', { detail }))
  })
}

/** The section's mount point inside a shadow root the component placed at `hostSelector`. */
function shadowMount(
  container: HTMLElement,
  hostSelector = '#nac-additional-content > div',
): HTMLElement | null {
  const root = container.querySelector(hostSelector)?.shadowRoot
  const mount = root?.lastElementChild
  return mount instanceof HTMLElement ? mount : null
}

const TAB_HOST = '#nac-weather-forecast + div'

/** Renders the widget, announces a forecast and waits for the tab's section. */
async function loadedTab() {
  const { container } = renderInWidget()
  fireNacLoaded({ zone_id: OLYMPICS, published: '2026-09-15T01:00:00Z' })
  const tab = await waitFor(() => {
    const found = shadowMount(container, TAB_HOST)
    if (!found) throw new Error('no message in the tab yet')
    return found
  })
  return { container, tab }
}

// These tests render the whole issuance, desktop and phone tables both, and ran past 5s when the
// pre-commit suite shared the machine.
jest.setTimeout(15_000)

describe('WidgetZoneWeather', () => {
  const fetchMock = jest.fn()

  beforeEach(() => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ day }) })
    global.fetch = fetchMock
  })

  it("asks for the day the widget's forecast is for and renders it in the widget's slot", async () => {
    const { container } = renderInWidget()
    fireNacLoaded({ zone_id: OLYMPICS, published: '2026-09-15T01:00:00Z', product: 'forecast' })

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/nwac/nwac-weather-zone?zone=${OLYMPICS}&published=2026-09-15T01%3A00%3A00Z`,
      expect.anything(),
    )
    const mount = await waitFor(() => {
      const found = shadowMount(container)
      if (!found) throw new Error('no section in the slot yet')
      return found
    })
    expect(within(mount).getByText('Mountain Weather')).toBeInTheDocument()
    expect(within(mount).queryByRole('radio')).toBeNull()
    expect(within(mount).getByText('Issued')).toBeInTheDocument()
    expect(within(mount).getByText(/^· (Morning|Afternoon) Forecast$/)).toBeInTheDocument()
    expect(within(mount).queryByText('Weather Synopsis')).toBeNull()
    expect(within(mount).queryByText('Total')).toBeNull()
  })

  it("takes over the Weather Forecast tab: the widget's own content hidden, the Overall view shown", async () => {
    const { container, tab } = await loadedTab()
    expect(within(tab).getByText('Mountain Weather')).toBeInTheDocument()
    expect(
      within(tab).getAllByText(/^Precipitation: Water Equivalent \(WE\)/).length,
    ).toBeGreaterThan(0)
    expect(container.querySelector('#nac-weather-forecast')).not.toBeVisible()

    const zone = await waitFor(() => {
      const found = shadowMount(container)
      if (!found) throw new Error('no zone section yet')
      return found
    })
    expect(within(zone).queryByText(/^Precipitation: Water Equivalent \(WE\)/)).toBeNull()
  })

  it("replaces the last forecast's tab content when the widget renders another", async () => {
    const { container } = renderInWidget()
    fireNacLoaded({ zone_id: OLYMPICS, published: '2026-09-15T01:00:00Z' })
    await waitFor(() => expect(shadowMount(container, TAB_HOST)).not.toBeNull())
    fireNacLoaded({ zone_id: OLYMPICS, published: '2026-09-16T01:00:00Z' })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    await waitFor(() =>
      expect(container.querySelectorAll('[data-nwac-weather-tab]')).toHaveLength(1),
    )
  })

  it('shows nothing for an event without a zone or a published time', () => {
    const { container } = renderInWidget()
    fireNacLoaded({ zone_name: 'Olympics' })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(shadowMount(container)).toBeNull()
  })

  it('says so in the tab, and adds nothing to the forecast, when the zone has no weather that day', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ day: null }) })
    const { container, tab } = await loadedTab()
    expect(shadowMount(container)).toBeNull()
    expect(within(tab).getByText(/No Mountain Weather Forecast was issued/)).toBeInTheDocument()
  })

  it("says the weather couldn't be loaded, not that none was issued, when the read fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502, json: async () => ({}) })
    const { container, tab } = await loadedTab()
    expect(shadowMount(container)).toBeNull()
    expect(within(tab).getByText(/couldn't be loaded/)).toBeInTheDocument()
    expect(within(tab).queryByText(/was issued/)).toBeNull()
  })

  describe('opened at the weather', () => {
    const PAGE = '/forecasts/avalanche/olympics'
    const scrollIntoView = jest.fn()

    beforeEach(() => {
      scrollIntoView.mockReset()
      Element.prototype.scrollIntoView = scrollIntoView
      window.history.replaceState(null, '', `${PAGE}#mountain-weather`)
    })

    afterEach(() => {
      window.history.replaceState(null, '', '/')
    })

    it('scrolls to the weather once, though the widget replaces the hash first', async () => {
      const { container } = renderInWidget()
      window.history.replaceState(null, '', '#/olympics/')
      fireNacLoaded({ zone_id: OLYMPICS, published: '2026-09-15T01:00:00Z' })
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1))
      expect(scrollIntoView.mock.contexts[0]).toBe(
        container.querySelector('#nac-additional-content > div'),
      )

      fireNacLoaded({ zone_id: OLYMPICS, published: '2026-09-16T01:00:00Z' })
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
      await waitFor(() => expect(shadowMount(container)).not.toBeNull())
      expect(scrollIntoView).toHaveBeenCalledTimes(1)
    })

    it('leaves a reader who has already moved where they are', async () => {
      const { container } = renderInWidget()
      fireEvent.wheel(window)
      fireNacLoaded({ zone_id: OLYMPICS, published: '2026-09-15T01:00:00Z' })
      await waitFor(() => expect(shadowMount(container)).not.toBeNull())
      expect(scrollIntoView).not.toHaveBeenCalled()
    })

    it('does nothing when the day has no weather', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ day: null }) })
      await loadedTab()
      expect(scrollIntoView).not.toHaveBeenCalled()
    })

    it('does nothing for an ordinary link', async () => {
      window.history.replaceState(null, '', PAGE)
      await loadedTab()
      expect(scrollIntoView).not.toHaveBeenCalled()
    })

    it('scrolls after a dated link whose redirect dropped the hash, and only for that zone', async () => {
      window.history.replaceState(null, '', '/weather/forecast/2026-09-14')
      const link = render(<ZoneWeatherLink href={`${PAGE}/2026-09-14`}>Olympics</ZoneWeatherLink>)
      const click = () => fireEvent.click(screen.getByRole('link', { name: 'Olympics' }))
      expect(screen.getByRole('link', { name: 'Olympics' })).toHaveAttribute(
        'href',
        `${PAGE}/2026-09-14#mountain-weather`,
      )

      click()
      window.history.replaceState(null, '', '/forecasts/avalanche/mt-hood#/mt-hood/')
      const other = renderInWidget()
      fireNacLoaded({ zone_id: OLYMPICS, published: '2026-09-15T01:00:00Z' })
      await waitFor(() => expect(shadowMount(other.container)).not.toBeNull())
      expect(scrollIntoView).not.toHaveBeenCalled()
      other.unmount()

      click()
      link.unmount()
      window.history.replaceState(null, '', `${PAGE}#/forecast/1/2`)
      renderInWidget()
      fireNacLoaded({ zone_id: OLYMPICS, published: '2026-09-15T01:00:00Z' })
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1))
    })
  })
})
