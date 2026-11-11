import { PrecipLegend, SnowLevelLegend } from '@/components/NWACWeather/Values'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

describe('the weather table keys', () => {
  it('centers the snow labels under their segments', () => {
    render(<PrecipLegend day={null} night={null} snow />)

    expect(screen.getAllByText('1–7"').at(-1)?.parentElement).toHaveClass('text-center')
  })

  it('puts the Day and Night hours before the snow bar, on its line', () => {
    const { container } = render(<PrecipLegend day="4 am–4 pm PST" night="4 pm–4 am PST" snow />)
    const key = container.querySelector('p')

    expect(key?.textContent).toMatch(/^Day 4 am–4 pm PSTNight 4 pm–4 am PSTSnow/)
  })

  it('leaves the snow level ticks where they fall', () => {
    render(<SnowLevelLegend />)

    expect(screen.getByText("2k'").parentElement).not.toHaveClass('text-center')
  })
})
