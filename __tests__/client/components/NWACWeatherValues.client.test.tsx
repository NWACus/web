import { SnowFillLegend, SnowLevelLegend } from '@/components/NWACWeather/Values'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

describe('the weather table keys', () => {
  it('centers the snow labels under their segments', () => {
    render(<SnowFillLegend />)

    expect(screen.getAllByText('1–7"').at(-1)?.parentElement).toHaveClass('text-center')
  })

  it('leaves the snow level ticks where they fall', () => {
    render(<SnowLevelLegend />)

    expect(screen.getByText("2k'").parentElement).not.toHaveClass('text-center')
  })
})
