import { MediaSlide } from '@/components/forecast/MediaSlide'
import { ExternalMediaType, MediaType, type MediaItem } from '@/services/nac/model/forecast'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

// jsdom has no ResizeObserver; react-zoom-pan-pinch (behind ZoomablePhoto) constructs one on mount.
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

const photo = (caption: string | null = 'A photo'): MediaItem => ({
  type: MediaType.Photo,
  url: 'https://example.test/photo.jpg',
  caption,
})

const youTube = (): MediaItem => ({
  type: MediaType.Video,
  url: {
    large: 'https://example.test/large.jpg',
    medium: 'https://example.test/medium.jpg',
    original: 'https://example.test/original.jpg',
    thumbnail: 'https://example.test/thumb.jpg',
    video_id: 'dQw4w9WgXcQ',
  },
  caption: 'Avalanche footage',
})

const pdf = (): MediaItem => ({
  type: MediaType.PDF,
  url: { original: 'https://example.test/report.pdf' },
})

const external = (): MediaItem => ({
  type: MediaType.External,
  url: { external_link: 'https://example.test/article', external_type: ExternalMediaType.Video },
  caption: 'An article',
})

describe('MediaSlide', () => {
  it('embeds a YouTube player for a video item', () => {
    render(<MediaSlide item={youTube()} />)
    const frame = document.querySelector('iframe')
    expect(frame).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
    expect(frame).toHaveAttribute('title', 'Avalanche footage')
  })

  it('percent-encodes the video id rather than interpolating it raw', () => {
    const injected: MediaItem = {
      type: MediaType.Video,
      url: {
        large: 'https://example.test/large.jpg',
        medium: 'https://example.test/medium.jpg',
        original: 'https://example.test/original.jpg',
        thumbnail: 'https://example.test/thumb.jpg',
        video_id: 'a b&c',
      },
      caption: null,
    }
    render(<MediaSlide item={injected} />)
    expect(document.querySelector('iframe')).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/a%20b%26c',
    )
  })

  it('renders a still photo with its caption as alt text', () => {
    render(<MediaSlide item={photo('Storm slab')} />)
    const img = document.querySelector('img[src="https://example.test/photo.jpg"]')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('alt', 'Storm slab')
  })

  it('renders a PDF as an outbound link', () => {
    render(<MediaSlide item={pdf()} />)
    expect(screen.getByRole('link', { name: 'Open PDF' })).toHaveAttribute(
      'href',
      'https://example.test/report.pdf',
    )
  })

  it('renders external media as an outbound link', () => {
    render(<MediaSlide item={external()} />)
    const link = screen.getByRole('link', { name: 'Open external media' })
    expect(link).toHaveAttribute('href', 'https://example.test/article')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('falls back to a message for media it cannot display', () => {
    // The schema collapses anything it can't recognise to `unknown`.
    render(<MediaSlide item={{ type: MediaType.Unknown }} />)
    expect(screen.getByText('Unsupported media type')).toBeInTheDocument()
  })
})
