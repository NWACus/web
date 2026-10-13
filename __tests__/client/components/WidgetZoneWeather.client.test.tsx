import { WidgetZoneWeather } from '@/components/NWACWeather/WidgetZoneWeather.client'
import { mapV3NWACWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'
import '@testing-library/jest-dom'
import { act, render, waitFor, within } from '@testing-library/react'
import fixture from '../../server/fixtures/nwac-weather-forecasts.json'

const day = mapV3NWACWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
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
    expect(within(mount).getByRole('radio', { name: /Morning/ })).toBeInTheDocument()
  })

  it("takes over the Weather Forecast tab: the widget's own content hidden, the legacy layout then the zone section", async () => {
    const { container } = renderInWidget()
    fireNacLoaded({ zone_id: OLYMPICS, published: '2026-09-15T01:00:00Z' })

    const tab = await waitFor(() => {
      const found = shadowMount(container, TAB_HOST)
      if (!found) throw new Error('no section in the tab yet')
      return found
    })
    expect(within(tab).getByText('Mountain Weather')).toBeInTheDocument()
    expect(container.querySelector('#nac-weather-forecast')).not.toBeVisible()
    // The legacy tab's layout leads, the zone section follows it.
    const headings = within(tab)
      .getAllByRole('heading', { hidden: true })
      .map((h) => h.textContent)
    expect(headings.indexOf('Weather Synopsis')).toBeLessThan(headings.indexOf('Weather Forecast'))
    expect(headings.indexOf('Weather Forecast')).toBeLessThan(headings.indexOf('Snow (in)'))
    // One per issuance; the shown one opens on the page's zone.
    for (const select of within(tab).getAllByLabelText('Use dropdown to select your zone')) {
      expect(select).toHaveDisplayValue('Olympics')
    }
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
    const { container } = renderInWidget()
    fireNacLoaded({ zone_id: OLYMPICS, published: '2026-09-15T01:00:00Z' })

    const tab = await waitFor(() => {
      const found = shadowMount(container, TAB_HOST)
      if (!found) throw new Error('no message in the tab yet')
      return found
    })
    expect(shadowMount(container)).toBeNull()
    expect(within(tab).getByText(/No Mountain Weather Forecast was issued/)).toBeInTheDocument()
  })
})
