import { ForecastMediaThumbnails } from '@/components/forecast/ForecastMediaThumbnails'
import { toLightboxMediaList } from '@/components/forecast/lightboxMedia'
import { ExternalMediaType, MediaType, type MediaItem } from '@/services/nac/model/forecast'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'

import { HOSTILE_CAPTION, expectCaptionsSanitized } from '../../captionSanitization'

const photo = (caption: string | null): MediaItem => ({
  type: MediaType.Photo,
  url: 'https://media.test/photo.jpg',
  caption,
})

// BTAC Tetons 2025-12-08 (product 175072) carries both.
const pdf: MediaItem = {
  type: MediaType.PDF,
  url: { original: 'https://media.test/20251206-Glory-NE-Ridge.pdf' },
  title: '20251206-Glory-NE-Ridge.pdf',
}
const youTubeLink: MediaItem = {
  type: MediaType.External,
  url: { external_link: 'https://youtu.be/ywmI1WsyUUI', external_type: ExternalMediaType.Video },
  title: 'Field observations Teton Pass Dec 6, 2025',
  caption: ' Photo: John Fitzgerald',
}

/**
 * The grid as `NativeForecastView` composes it: a product's media run through the server-side
 * builder, then handed across the client boundary. Going through `toLightboxMediaList` rather than
 * hand-built props is the point — it is the composition being tested, not the component alone.
 */
const renderGrid = (media: MediaItem[]) =>
  render(<ForecastMediaThumbnails media={toLightboxMediaList(media)} />)

describe('ForecastMediaThumbnails', () => {
  it('opens a caption the server has already sanitized', () => {
    renderGrid([photo(HOSTILE_CAPTION)])

    fireEvent.click(screen.getByRole('button', { name: 'Open media 1 of 1' }))

    expectCaptionsSanitized()
  })

  it('opens the thumbnail that was clicked', () => {
    renderGrid([photo('<p>one</p>'), photo('<p>two</p>')])

    fireEvent.click(screen.getByRole('button', { name: 'Open media 2 of 2' }))

    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    expect(screen.getByText('two')).toBeInTheDocument()
  })

  // Filtering moved to the server alongside the sanitizing, so the grid renders what it is given.
  it('renders nothing when the product has no displayable media', () => {
    const { container } = renderGrid([
      { type: null, url: null, caption: '', title: '' },
      { type: MediaType.Unknown },
    ])

    expect(container).toBeEmptyDOMElement()
  })

  // Forecast-125, Forecast-131
  it('opens a PDF or link tile in a new tab, titled, and keeps it out of the lightbox', () => {
    renderGrid([photo('<p>one</p>'), pdf, youTubeLink, photo('<p>two</p>')])

    const pdfTile = screen.getByRole('link', { name: /^20251206-Glory-NE-Ridge\.pdf/ })
    expect(pdfTile).toHaveAttribute('href', 'https://media.test/20251206-Glory-NE-Ridge.pdf')
    expect(pdfTile).toHaveAttribute('target', '_blank')
    expect(pdfTile).toHaveAccessibleName(/opens in a new tab/)
    expect(
      screen.getByRole('link', { name: /^Field observations Teton Pass Dec 6, 2025/ }),
    ).toHaveAttribute('href', 'https://youtu.be/ywmI1WsyUUI')

    // The two photos are the lightbox's whole sequence.
    expect(screen.getAllByRole('button', { name: /^Open media \d of 2$/ })).toHaveLength(2)
  })

  // Forecast-124
  it('marks each lightbox tile with the expand chip, a video with a play button too', () => {
    const video: MediaItem = {
      type: MediaType.Video,
      url: 'dQw4w9WgXcQ',
      caption: null,
    }
    renderGrid([photo(null), video])

    const [photoTile, videoTile] = screen.getAllByRole('button', { name: /^Open media/ })
    // The tile is the button, so the marks inside it are decoration, not nested controls.
    expect(within(photoTile).queryByRole('button')).toBeNull()
    expect(photoTile.querySelectorAll('svg')).toHaveLength(1)
    expect(videoTile.querySelectorAll('svg')).toHaveLength(2)
  })
})
