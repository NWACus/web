import { AvalancheProblemCard } from '@/components/forecast/AvalancheProblemCard'
import {
  AvalancheProblemLikelihood,
  AvalancheProblemLocation,
  AvalancheProblemName,
  AvalancheProblemType,
  MediaType,
  type AvalancheProblem,
} from '@/services/nac/types/forecastSchemas'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

const baseProblem: AvalancheProblem = {
  id: 1,
  forecast_id: 100,
  rank: 1,
  avalanche_problem_id: AvalancheProblemType.StormSlab,
  name: AvalancheProblemName.StormSlab,
  likelihood: AvalancheProblemLikelihood.Likely,
  location: [
    AvalancheProblemLocation.NorthUpper,
    AvalancheProblemLocation.NorthMiddle,
    AvalancheProblemLocation.NortheastUpper,
  ],
  size: [1, 2],
  discussion: '<p>Watch for storm slabs on north-facing terrain.</p>',
  problem_description: 'Storm Slab description',
  icon: 'http://api.avalanche.org/img/avalanche_problems/StormSlab.png',
  media: { type: MediaType.Unknown },
}

describe('AvalancheProblemCard', () => {
  it('renders the problem name', () => {
    render(<AvalancheProblemCard problem={baseProblem} />)
    expect(screen.getByText('Storm Slab')).toBeInTheDocument()
  })

  it('renders the problem icon with correct src', () => {
    render(<AvalancheProblemCard problem={baseProblem} />)
    const icon = document.querySelector('img[src="/images/problem-icons/StormSlab.png"]')
    expect(icon).toBeInTheDocument()
  })

  it('renders sanitized discussion HTML', () => {
    render(<AvalancheProblemCard problem={baseProblem} />)
    expect(screen.getByText('Watch for storm slabs on north-facing terrain.')).toBeInTheDocument()
  })

  it('does not render discussion when null', () => {
    const problem = { ...baseProblem, discussion: null }
    const { container } = render(<AvalancheProblemCard problem={problem} />)
    expect(container.querySelector('.prose')).not.toBeInTheDocument()
  })

  it('renders likelihood and size labels', () => {
    render(<AvalancheProblemCard problem={baseProblem} />)
    expect(screen.getByText('Likelihood')).toBeInTheDocument()
    expect(screen.getByText('Size')).toBeInTheDocument()
  })

  it('renders a media thumbnail for image type', () => {
    const problem: AvalancheProblem = {
      ...baseProblem,
      media: {
        type: MediaType.Image,
        url: {
          large: 'https://example.com/large.jpg',
          medium: 'https://example.com/medium.jpg',
          original: 'https://example.com/original.jpg',
          thumbnail: 'https://example.com/thumb.jpg',
        },
        caption: 'Storm slab crown',
        title: null,
      },
    }
    render(<AvalancheProblemCard problem={problem} />)
    const img = document.querySelector('img[src="https://example.com/thumb.jpg"]')
    expect(img).toBeInTheDocument()
  })

  it('does not render a thumbnail for unknown media type', () => {
    render(<AvalancheProblemCard problem={baseProblem} />)
    const images = document.querySelectorAll('img')
    // Only the problem icon, no media thumbnail
    expect(images).toHaveLength(1)
  })
})
