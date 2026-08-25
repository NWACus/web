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
import { fireEvent, render, screen } from '@testing-library/react'

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

  it('renders the example photo (medium size) with its caption for image type', () => {
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
    const img = document.querySelector('img[src="https://example.com/medium.jpg"]')
    expect(img).toBeInTheDocument()
    expect(screen.getByText('Storm slab crown')).toBeInTheDocument()
  })

  it('renders the numbered problem heading', () => {
    render(<AvalancheProblemCard problem={{ ...baseProblem, rank: 2 }} />)
    expect(screen.getByText('Problem #2: Storm Slab')).toBeInTheDocument()
  })

  it('renders the four labeled problem columns', () => {
    render(<AvalancheProblemCard problem={baseProblem} />)
    expect(screen.getByText('Problem Type')).toBeInTheDocument()
    expect(screen.getByText('Aspect/Elevation')).toBeInTheDocument()
    expect(screen.getByText('Likelihood')).toBeInTheDocument()
    expect(screen.getByText('Size')).toBeInTheDocument()
  })

  it('does not render a thumbnail for unknown media type', () => {
    render(<AvalancheProblemCard problem={baseProblem} />)
    const images = document.querySelectorAll('img')
    // Only the problem icon, no media thumbnail
    expect(images).toHaveLength(1)
  })

  it('opens an example photo in the lightbox rather than leaving it static', async () => {
    render(<AvalancheProblemCard problem={withMedia(imageMedia())} />)

    fireEvent.click(screen.getByRole('button', { name: 'Expand embedded image' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  // Real shape, from CNFAIC/SNFAC/NWAC forecasts: a YouTube id with its own poster frame. This
  // used to render as nothing at all.
  it('renders a problem video as its poster frame, marked playable', () => {
    render(<AvalancheProblemCard problem={withMedia(videoMedia())} />)

    expect(document.querySelector('img[src="https://example.com/medium.jpg"]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play embedded video' })).toBeInTheDocument()
    expect(screen.getByText('Ben on the snowpack')).toBeInTheDocument()
  })

  it('plays a problem video in the lightbox', async () => {
    render(<AvalancheProblemCard problem={withMedia(videoMedia())} />)

    fireEvent.click(screen.getByRole('button', { name: 'Play embedded video' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(document.querySelector('iframe')).toHaveAttribute(
      'src',
      expect.stringContaining('73fFkbWuMOo'),
    )
  })

  // The other real shape (four SNFAC forecasts): the url is a bare YouTube id and there is no
  // poster URL, so it has to come from YouTube.
  it('falls back to YouTube’s poster when a video carries only its id', () => {
    render(
      <AvalancheProblemCard
        problem={withMedia({
          type: MediaType.Video,
          url: '784O9k5_-fc',
          caption: 'Chris on Avalanche Peak',
          title: null,
        })}
      />,
    )

    expect(
      document.querySelector('img[src="https://i.ytimg.com/vi/784O9k5_-fc/hqdefault.jpg"]'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play embedded video' })).toBeInTheDocument()
  })
})

const withMedia = (media: AvalancheProblem['media']): AvalancheProblem => ({
  ...baseProblem,
  media,
})

const imageMedia = (): AvalancheProblem['media'] => ({
  type: MediaType.Image,
  url: {
    large: 'https://example.com/large.jpg',
    medium: 'https://example.com/medium.jpg',
    original: 'https://example.com/original.jpg',
    thumbnail: 'https://example.com/thumb.jpg',
  },
  caption: 'Storm slab crown',
  title: null,
})

const videoMedia = (): AvalancheProblem['media'] => ({
  type: MediaType.Video,
  url: {
    large: 'https://example.com/large.jpg',
    medium: 'https://example.com/medium.jpg',
    original: 'https://example.com/original.jpg',
    thumbnail: 'https://example.com/thumb.jpg',
    video_id: '73fFkbWuMOo',
  },
  caption: 'Ben on the snowpack',
  title: null,
})
