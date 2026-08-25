import { StationCsvForm } from '@/components/WeatherStations/StationCsvForm'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

function renderForm() {
  render(
    <StationCsvForm
      slug="alpental"
      dataloggers={[{ stid: '4', label: 'Alpental Base' }]}
      years={[2026]}
    />,
  )
}

let clicks: number

beforeEach(() => {
  clicks = 0
  // The developer's own site key would otherwise leave the button captcha-locked.
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  // jsdom has neither object URLs nor downloads.
  global.URL.createObjectURL = jest.fn().mockReturnValue('blob:csv')
  global.URL.revokeObjectURL = jest.fn()
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
    clicks += 1
  })
})

afterEach(() => {
  jest.restoreAllMocks()
  if (SITE_KEY !== undefined) process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = SITE_KEY
})

describe('StationCsvForm', () => {
  it('spins while the CSV is being prepared, then saves it', async () => {
    let release: (response: { ok: boolean; blob: () => Promise<Blob> }) => void = () => {}
    global.fetch = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        release = resolve
      }),
    )
    renderForm()

    fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }))

    expect(await screen.findByRole('button', { name: /Preparing CSV/ })).toBeDisabled()
    expect(global.fetch).toHaveBeenCalledWith(
      '/weather/stations/alpental/csv?stid=4&year=2026&units=imperial',
    )

    release({ ok: true, blob: async () => new Blob(['date_time\n']) })

    await waitFor(() => expect(clicks).toBe(1))
    expect(screen.getByRole('button', { name: 'Download CSV' })).toBeEnabled()
  })

  it('says so when the download fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 })
    renderForm()

    fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('That download failed')
    expect(clicks).toBe(0)
  })
})
