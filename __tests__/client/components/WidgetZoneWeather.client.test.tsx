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
      <WidgetZoneWeather center="nwac" timezone="America/Los_Angeles" />
    </>,
  )
}

function fireNacLoaded(detail: Record<string, unknown>) {
  act(() => {
    window.dispatchEvent(new CustomEvent('nac-loaded', { detail }))
  })
}

/** The section's mount point inside the slot's shadow root. */
function shadowMount(container: HTMLElement): HTMLElement | null {
  const root = container.querySelector('#nac-additional-content > div')?.shadowRoot
  const mount = root?.lastElementChild
  return mount instanceof HTMLElement ? mount : null
}

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

  it('shows nothing for an event without a zone or a published time', () => {
    const { container } = renderInWidget()
    fireNacLoaded({ zone_name: 'Olympics' })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(shadowMount(container)).toBeNull()
  })

  it('shows nothing when the zone has no weather that day', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ day: null }) })
    const { container } = renderInWidget()
    fireNacLoaded({ zone_id: OLYMPICS, published: '2026-09-15T01:00:00Z' })

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(shadowMount(container)).toBeNull()
  })
})
