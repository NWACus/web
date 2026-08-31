import { ForecastMediaThumbnails } from '@/components/forecast/ForecastMediaThumbnails'
import { toLightboxMediaList } from '@/components/forecast/lightboxMedia'
import { MediaType, type MediaItem } from '@/services/nac/model/forecast'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import { HOSTILE_CAPTION, expectCaptionsSanitized } from '../../captionSanitization'

const photo = (caption: string | null): MediaItem => ({
  type: MediaType.Photo,
  url: 'https://media.test/photo.jpg',
  caption,
})

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
})
