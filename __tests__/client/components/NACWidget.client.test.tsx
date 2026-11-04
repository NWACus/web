import { NACWidget } from '@/components/NACWidget'
import { NACWidgetsConfigProvider } from '@/providers/NACWidgetsConfigProvider'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import posthog from 'posthog-js'

// The widget script is loaded from a remote CDN; never fetch it in tests.
jest.mock('next/script', () => ({
  __esModule: true,
  default: () => null,
}))

// Stand-in for the posthog-js singleton; the test only checks the same object is handed over.
jest.mock('posthog-js', () => ({
  __esModule: true,
  default: { __loaded: true, capture: jest.fn() },
}))

const config = { version: '1.0.0', baseUrl: 'https://widgets.example.com', devMode: false }

describe('NACWidget', () => {
  const originalPostHogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

  afterEach(() => {
    delete window.mapWidgetData
    delete window.forecastWidgetData
    process.env.NEXT_PUBLIC_POSTHOG_KEY = originalPostHogKey
  })

  it('passes mapHeight through to the danger map widget as mapWidgetData.height', () => {
    render(
      <NACWidgetsConfigProvider config={config}>
        <NACWidget center="nwac" widget="map" mapHeight={500} />
      </NACWidgetsConfigProvider>,
    )

    expect(window.mapWidgetData).toMatchObject({
      centerId: 'NWAC',
      mountId: '#nac-widget-map',
      controlledMount: true,
      height: 500,
    })
  })

  it('does not set a height on widgets other than the danger map', () => {
    render(
      <NACWidgetsConfigProvider config={config}>
        <NACWidget center="nwac" widget="forecast" mapHeight={500} />
      </NACWidgetsConfigProvider>,
    )

    expect(window.forecastWidgetData).toMatchObject({ centerId: 'NWAC' })
    expect(window.forecastWidgetData).not.toHaveProperty('height')
  })

  it('hands the PostHog client to the widget when PostHog is configured', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'

    render(
      <NACWidgetsConfigProvider config={config}>
        <NACWidget center="nwac" widget="forecast" />
      </NACWidgetsConfigProvider>,
    )

    expect(window.forecastWidgetData?.posthog).toBe(posthog)
  })

  it('omits the PostHog client when PostHog is not configured', () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY

    render(
      <NACWidgetsConfigProvider config={config}>
        <NACWidget center="nwac" widget="forecast" />
      </NACWidgetsConfigProvider>,
    )

    expect(window.forecastWidgetData).toMatchObject({ centerId: 'NWAC' })
    expect(window.forecastWidgetData).not.toHaveProperty('posthog')
  })
})
