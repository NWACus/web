import { NACWidget } from '@/components/NACWidget'
import { NACWidgetsConfigProvider } from '@/providers/NACWidgetsConfigProvider'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

// The widget script is loaded from a remote CDN; never fetch it in tests.
jest.mock('next/script', () => ({
  __esModule: true,
  default: () => null,
}))

const config = { version: '1.0.0', baseUrl: 'https://widgets.example.com', devMode: false }

describe('NACWidget', () => {
  afterEach(() => {
    delete window.mapWidgetData
    delete window.forecastWidgetData
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
})
