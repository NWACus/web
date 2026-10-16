import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

// ButtonLink reads the tenant for analytics; the pane's two buttons don't need it here.
jest.mock('../../../src/components/ButtonLink', () => ({
  ButtonLink: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

import { ZoneTabs } from '@/components/forecast/zoneObservations/ZoneTabs.client'

const week = {
  window: { from: '2026-02-24', to: '2026-03-02' },
  observations: [
    {
      id: 'obs-1',
      date: '2026-03-02',
      location: 'Butterfield',
      observerType: 'forecaster',
      organization: 'Sawtooth Avalanche Center',
      avalanchesObserved: false,
      instability: true,
      thumbnail: null,
      mediaCount: 0,
    },
  ],
  avalanches: [],
}

function renderTabs() {
  return render(
    <ZoneTabs
      endpoint="/api/snfac/zone-observations?zone=galena"
      zoneName="Galena Summit & Eastern Mtns"
      forecastLabel="Avalanche Information"
      bottomLine={<p>Bottom line</p>}
      panel={<p>Forecast panel</p>}
    />,
  )
}

const fetchMock = jest.fn()

beforeEach(() => {
  window.history.replaceState(null, '', '/forecasts/avalanche/galena')
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({ ok: true, json: async () => week })
  Object.defineProperty(global, 'fetch', { value: fetchMock, writable: true })
})

it('opens on the forecast and fetches nothing until a zone tab opens', () => {
  renderTabs()

  expect(screen.getByRole('tab', { name: 'Avalanche Information' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(screen.getByText('Forecast panel')).toBeVisible()
  expect(fetchMock).not.toHaveBeenCalled()
  // Every tab's panel exists from the first render, so aria-controls always resolves.
  for (const tab of screen.getAllByRole('tab')) {
    expect(document.getElementById(tab.getAttribute('aria-controls') ?? '')).not.toBeNull()
  }
})

it('shows the zone’s observations and puts the tab in the address', async () => {
  renderTabs()

  fireEvent.click(screen.getByRole('tab', { name: 'Observations' }))

  expect(window.location.search).toBe('?tab=observations')
  expect(await screen.findByText('Butterfield')).toBeInTheDocument()
  expect(screen.getByText('Collapsing/Cracking')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Butterfield/ })).toHaveAttribute(
    'href',
    '/observations/obs-1',
  )
  // Hidden on screen, but still the forecast on paper.
  expect(screen.getByText('Forecast panel').parentElement).toHaveClass('hidden', 'print:block')
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

it('opens on the tab in the address and drops an unknown one', async () => {
  window.history.replaceState(null, '', '/forecasts/avalanche/galena?tab=avalanches')
  renderTabs()

  expect(await screen.findByText('No recent avalanches')).toBeInTheDocument()

  window.history.replaceState(null, '', '/forecasts/avalanche/galena?tab=weather&x=1')
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate'))
  })

  expect(window.location.search).toBe('?x=1')
  expect(screen.getByRole('tab', { name: 'Avalanche Information' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})

it('moves between tabs with the arrow keys without stacking history', async () => {
  const pushState = jest.spyOn(window.history, 'pushState')
  renderTabs()

  fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })
  fireEvent.keyDown(screen.getByRole('tablist'), { key: 'End' })

  expect(screen.getByRole('tab', { name: 'Avalanches' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: 'Avalanches' })).toHaveFocus()
  expect(pushState).not.toHaveBeenCalled()
  expect(await screen.findByText('No recent avalanches')).toBeInTheDocument()
  pushState.mockRestore()
})

it('says so when the records can’t load, and retries', async () => {
  fetchMock.mockResolvedValueOnce({ ok: false, status: 502, json: async () => ({}) })
  renderTabs()

  fireEvent.click(screen.getByRole('tab', { name: 'Observations' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.t be loaded/)

  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  await waitFor(() => expect(screen.getByText('Butterfield')).toBeInTheDocument())
  expect(fetchMock).toHaveBeenCalledTimes(2)
})
