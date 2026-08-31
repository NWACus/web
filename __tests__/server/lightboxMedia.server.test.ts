import { toLightboxMedia, toLightboxMediaList } from '@/components/forecast/lightboxMedia'
import { getCaption } from '@/components/forecast/mediaItem'
import { MediaType, type MediaItem } from '@/services/nac/model/forecast'

const photo = (caption: string | null): MediaItem => ({
  type: MediaType.Photo,
  url: 'https://media.test/photo.jpg',
  caption,
})

// What a forecaster's caption looks like when it is doing the thing this pairing exists to stop:
// the lightbox writes a caption with dangerouslySetInnerHTML, so an authored handler or script tag
// would execute if nothing removed it first.
const HOSTILE = '<p>Photo: <img src="x" onerror="alert(1)"><script>alert(2)</script> Erik</p>'

describe('toLightboxMedia', () => {
  it('sanitizes the caption the lightbox will render as HTML', () => {
    const { captionHtml } = toLightboxMedia(photo(HOSTILE))

    expect(captionHtml).not.toContain('onerror')
    expect(captionHtml).not.toContain('<script')
    expect(captionHtml).toContain('Erik')
  })

  it('keeps the markup a forecaster is allowed to write', () => {
    expect(toLightboxMedia(photo('<p>Photo: <em>Erik Wilson</em></p>')).captionHtml).toBe(
      '<p>Photo: <em>Erik Wilson</em></p>',
    )
  })

  it('has no caption to render when the item has none', () => {
    expect(toLightboxMedia(photo(null)).captionHtml).toBeNull()
    expect(toLightboxMedia(photo('')).captionHtml).toBeNull()
  })

  /**
   * `resolveMediaSlide` reads the item's own caption for a slide's `alt` and `title`. Those are
   * plain-text attributes React escapes, so they need no sanitizing — and leaving them authored
   * keeps a slide's accessible name identical to what it was before sanitizing moved server-side.
   */
  it('leaves the item itself as authored', () => {
    expect(getCaption(toLightboxMedia(photo(HOSTILE)).item)).toBe(HOSTILE)
  })
})

describe('toLightboxMediaList', () => {
  it('sanitizes every caption', () => {
    const media = toLightboxMediaList([photo(HOSTILE), photo('<p>fine</p>'), photo(HOSTILE)])

    expect(media).toHaveLength(3)
    expect(media.every((entry) => !entry.captionHtml?.includes('onerror'))).toBe(true)
  })

  it('drops the placeholders the API returns in place of media', () => {
    const media = toLightboxMediaList([
      photo('<p>fine</p>'),
      { type: null, url: null, caption: '', title: '' },
      { type: MediaType.None, url: '', caption: '' },
      { type: MediaType.Unknown },
    ])

    expect(media).toHaveLength(1)
    expect(media[0].captionHtml).toBe('<p>fine</p>')
  })
})
