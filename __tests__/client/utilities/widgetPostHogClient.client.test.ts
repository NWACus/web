import { createWidgetPostHogClient, POSTHOG_SOURCE } from '@/utilities/widgetPostHogClient'
import type { PostHog } from 'posthog-js'

function fakePostHog() {
  return {
    capture: jest.fn(),
    get_distinct_id: jest.fn(() => 'distinct-1'),
    get_session_id: jest.fn(() => 'session-1'),
    get_property: jest.fn((key: string) => (key === 'source' ? POSTHOG_SOURCE : undefined)),
    register: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
  }
}

// The facade only calls the methods stubbed above; the rest of the client is irrelevant here.
function asPostHog(fake: ReturnType<typeof fakePostHog>): PostHog {
  // @ts-expect-error partial stub of the posthog-js client
  return fake
}

describe('createWidgetPostHogClient', () => {
  it('forwards capture with host_source stamped on every event', () => {
    const fake = fakePostHog()
    const client = createWidgetPostHogClient(asPostHog(fake))

    client.capture('observation_opened', { observation_id: '42', widget: 'observations' })

    expect(fake.capture).toHaveBeenCalledWith(
      'observation_opened',
      {
        observation_id: '42',
        widget: 'observations',
        host_source: POSTHOG_SOURCE,
      },
      undefined,
    )
  })

  it('forwards capture options, e.g. send_instantly for clicks that navigate away', () => {
    const fake = fakePostHog()
    const client = createWidgetPostHogClient(asPostHog(fake))

    client.capture('weather_forecast_link_clicked', {}, { send_instantly: true })

    expect(fake.capture).toHaveBeenCalledWith(
      'weather_forecast_link_clicked',
      { host_source: POSTHOG_SOURCE },
      { send_instantly: true },
    )
  })

  it('does not let the widget override host_source', () => {
    const fake = fakePostHog()
    const client = createWidgetPostHogClient(asPostHog(fake))

    client.capture('forecast_viewed', { host_source: 'somewhere-else' })

    expect(fake.capture).toHaveBeenCalledWith(
      'forecast_viewed',
      { host_source: POSTHOG_SOURCE },
      undefined,
    )
  })

  it('exposes read-only accessors and nothing that mutates host state', () => {
    const fake = fakePostHog()
    const client = createWidgetPostHogClient(asPostHog(fake))

    expect(client.get_distinct_id()).toBe('distinct-1')
    expect(client.get_session_id()).toBe('session-1')
    expect(client.get_property('source')).toBe(POSTHOG_SOURCE)
    expect(Object.keys(client).sort()).toEqual([
      'capture',
      'get_distinct_id',
      'get_property',
      'get_session_id',
    ])
  })
})
