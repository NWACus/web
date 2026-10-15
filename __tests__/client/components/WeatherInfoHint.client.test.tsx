import { WeatherTable } from '@/components/forecast/WeatherTable'
import { rowColumnWeatherDataSchema } from '@/services/nac/types/forecastSchemas'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

/** A v2 row-help string, in the shape the API actually sends it — plus a tag the sanitizer drops. */
const HELP =
  "<h5 class='afp-html-h5'>Ridgetop Wind Speed</h5><strong>CALM</strong> - No air motion." +
  '<script>alert(1)</script>'

const table = rowColumnWeatherDataSchema.parse({
  zone_id: '3',
  zone_name: 'Galena Summit & Eastern Mtns',
  columns: [[{ heading: 'Today', subheading: '(5AM - 5PM)', width: 100 }]],
  rows: [
    { heading: 'Cloud Cover', field: 'select', help: null, options: null, unit: null },
    { heading: 'Ridgeline Wind Speed', field: 'select', help: HELP, options: null, unit: null },
  ],
  data: [[{ value: 'Overcast' }], [{ value: 'Moderate' }]],
})

const hintName = 'What "Ridgeline Wind Speed" means'

describe('weather table field help', () => {
  it('marks only the rows that carry help', () => {
    render(<WeatherTable table={table} />)

    expect(screen.getByRole('button', { name: hintName })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cloud Cover/ })).not.toBeInTheDocument()
  })

  it('keeps the help out of the page until it is asked for', () => {
    render(<WeatherTable table={table} />)

    expect(screen.queryByText(/No air motion/)).not.toBeInTheDocument()
  })

  it('reveals the help on click, sanitized', () => {
    const { baseElement } = render(<WeatherTable table={table} />)

    fireEvent.click(screen.getByRole('button', { name: hintName }))

    expect(screen.getByText('Ridgetop Wind Speed')).toBeInTheDocument()
    expect(screen.getByText(/No air motion/)).toBeInTheDocument()
    expect(baseElement.querySelector('script')).toBeNull()
  })

  it('reveals the help on hover', () => {
    render(<WeatherTable table={table} />)

    fireEvent.mouseEnter(screen.getByRole('button', { name: hintName }))

    expect(screen.getByText(/No air motion/)).toBeInTheDocument()
  })
})
