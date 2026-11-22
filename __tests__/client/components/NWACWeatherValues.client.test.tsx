import { PrecipLegend, SnowLevelLegend } from '@/components/NWACWeather/Values'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

describe('the weather table keys', () => {
  it('prints each snow label inside its own color', () => {
    render(<PrecipLegend day={null} night={null} snow />)

    expect(screen.getAllByText('1–7"').at(-1)).toHaveClass('bg-blue-100')
  })

  it('puts the Day and Night hours before the snow bar, on its line', () => {
    const { container } = render(<PrecipLegend day="4 am–4 pm PST" night="4 pm–4 am PST" snow />)
    const key = container.querySelector('p')

    expect(key?.textContent).toMatch(/^Day 4 am–4 pm PSTNight 4 pm–4 am PSTSnow/)
  })

  it('gives labeled snow level steps twice the room of the steps between them', () => {
    render(<SnowLevelLegend />)

    expect(screen.getByText("2k'").parentElement).toHaveStyle({
      gridTemplateColumns: '1fr 2fr 1fr 2fr 1fr 2fr 1fr 2fr 1fr 2fr',
    })
  })
})
