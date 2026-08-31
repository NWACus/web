import { MediaLightbox } from '@/components/forecast/MediaLightbox'
import type { LightboxMedia } from '@/components/forecast/lightboxMedia'
import { MediaType, type MediaItem } from '@/services/nac/model/forecast'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

const photo = (caption: string | null): MediaItem => ({
  type: MediaType.Photo,
  url: 'https://media.test/photo.jpg',
  caption,
})

/** A caption as the forecaster wrote it, before anything cleaned it. */
const AUTHORED = '<img src="x" onerror="alert(1)">Erik'
/** The same caption after the server's sanitize pass — what the lightbox is handed. */
const SANITIZED = '<img src="x">Erik'

const open = (media: LightboxMedia[]) =>
  render(<MediaLightbox media={media} initialIndex={0} open onOpenChange={() => {}} />)

describe('MediaLightbox', () => {
  it('renders the caption it was handed', () => {
    open([
      { item: photo('<p>Photo: <em>Erik</em></p>'), captionHtml: '<p>Photo: <em>Erik</em></p>' },
    ])

    expect(screen.getByText('Erik')).toBeInTheDocument()
  })

  /**
   * The point of #1234: the lightbox is a `'use client'` component, so sanitizing inside it shipped
   * `sanitize-html` to every reader of a forecast page. It renders `captionHtml`, which its caller
   * sanitized on the server, and never reads `item.caption`.
   */
  it('writes the sanitized caption as HTML, not the item’s authored one', () => {
    open([{ item: photo(AUTHORED), captionHtml: SANITIZED }])

    expect(screen.getByText('Erik').innerHTML).toBe(SANITIZED)
    expect(document.querySelector('[onerror]')).toBeNull()
  })

  /**
   * `resolveMediaSlide` still names a slide from the item's own caption. That is deliberate: `alt`
   * is a plain-text attribute React escapes, so authored markup lands there inert, and keeping it
   * authored means a slide's accessible name did not change when sanitizing moved to the server.
   */
  it('names the slide from the authored caption, where markup cannot execute', () => {
    open([{ item: photo(AUTHORED), captionHtml: SANITIZED }])

    expect(screen.getByRole('img', { name: AUTHORED })).toBeInTheDocument()
    expect(document.querySelector('[onerror]')).toBeNull()
  })

  it('renders no caption element when the item has none', () => {
    open([{ item: photo(null), captionHtml: null }])

    expect(screen.queryByText(/Photo:/)).not.toBeInTheDocument()
  })

  it('shows the position only when there is more than one slide', () => {
    const one = [{ item: photo('a'), captionHtml: '<p>a</p>' }]
    const { unmount } = open(one)
    expect(screen.queryByText('1 / 1')).not.toBeInTheDocument()
    unmount()

    open([...one, { item: photo('b'), captionHtml: '<p>b</p>' }])
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })
})
