import { LikelihoodSlider, SizeSlider } from '@/components/forecast/ProblemSlider'
import { AvalancheProblemLikelihood } from '@/services/nac/types/forecastSchemas'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

function boldLabels(): string[] {
  return screen
    .getAllByText(/./)
    .filter((el) => el.className.includes('font-bold'))
    .map((el) => el.textContent ?? '')
}

describe('SizeSlider', () => {
  it('bolds every size inside the forecast range', () => {
    render(<SizeSlider size={[1, 2]} />)
    expect(boldLabels()).toEqual(['Small (D1)', 'Large (D2)'])
  })

  it('places a half-size range between the labeled steps', () => {
    render(<SizeSlider size={[1.5, 2.5]} />)
    expect(boldLabels()).toEqual(['Large (D2)'])
  })

  it('marks nothing for an empty size', () => {
    render(<SizeSlider size={[]} />)
    expect(boldLabels()).toEqual([])
  })
})

describe('LikelihoodSlider', () => {
  it('treats "almost certain" as the top step', () => {
    render(<LikelihoodSlider likelihood={AvalancheProblemLikelihood.AlmostCertain} />)
    expect(boldLabels()).toEqual(['Certain'])
  })
})
