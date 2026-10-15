import {
  displayableMedia,
  getCaption,
  getFullUrl,
  getMediaLink,
  getPosterUrl,
  getThumbnailUrl,
  getYouTubeVideoId,
  mediaGridTiles,
  resolveMediaSlide,
} from '@/components/forecast/mediaItem'
import { ExternalMediaType, MediaType, type MediaItem } from '@/services/nac/model/forecast'

// The model's MediaItem is a union of zod-inferred shapes; these builders produce the wire shapes
// the NAC v2 API actually returns for each media kind.
const imageItem = (caption: string | null = 'An image'): MediaItem => ({
  type: MediaType.Image,
  url: {
    large: 'https://example.test/large.jpg',
    medium: 'https://example.test/medium.jpg',
    original: 'https://example.test/original.jpg',
    thumbnail: 'https://example.test/thumb.jpg',
  },
  caption,
})

const photoItem = (): MediaItem => ({
  type: MediaType.Photo,
  url: 'https://example.test/photo.jpg',
  caption: 'A photo',
})

const youTubeItem = (): MediaItem => ({
  type: MediaType.Video,
  url: {
    large: 'https://example.test/large.jpg',
    medium: 'https://example.test/medium.jpg',
    original: 'https://example.test/original.jpg',
    thumbnail: 'https://example.test/video-thumb.jpg',
    video_id: 'dQw4w9WgXcQ',
  },
  caption: 'A video',
})

const externalItem = (title?: string): MediaItem => ({
  type: MediaType.External,
  url: {
    external_link: 'https://example.test/article',
    external_type: ExternalMediaType.Video,
  },
  title,
  caption: 'An external link',
})

const pdfItem = (title?: string | null): MediaItem => ({
  type: MediaType.PDF,
  url: { original: 'https://example.test/report.pdf' },
  title,
})

describe('getThumbnailUrl', () => {
  it('uses the thumbnail variant for an image', () => {
    expect(getThumbnailUrl(imageItem())).toBe('https://example.test/thumb.jpg')
  })

  it('uses the bare url string for a photo', () => {
    expect(getThumbnailUrl(photoItem())).toBe('https://example.test/photo.jpg')
  })

  it('uses the thumbnail variant for a hosted video', () => {
    expect(getThumbnailUrl(youTubeItem())).toBe('https://example.test/video-thumb.jpg')
  })

  it('returns null for kinds with no thumbnail', () => {
    expect(getThumbnailUrl(externalItem())).toBeNull()
    expect(getThumbnailUrl(pdfItem())).toBeNull()
  })
})

describe('getFullUrl', () => {
  it('uses the original variant for an image', () => {
    expect(getFullUrl(imageItem())).toBe('https://example.test/original.jpg')
  })

  it('uses the bare url string for a photo', () => {
    expect(getFullUrl(photoItem())).toBe('https://example.test/photo.jpg')
  })

  it('returns null for non-still kinds', () => {
    expect(getFullUrl(youTubeItem())).toBeNull()
    expect(getFullUrl(pdfItem())).toBeNull()
  })
})

describe('getYouTubeVideoId', () => {
  it('extracts video_id from a video item', () => {
    expect(getYouTubeVideoId(youTubeItem())).toBe('dQw4w9WgXcQ')
  })

  it('returns null for a video with no video_id', () => {
    const linkOnlyVideo: MediaItem = {
      type: MediaType.Video,
      url: { external_link: 'https://example.test/v', external_type: ExternalMediaType.Video },
      caption: null,
    }
    expect(getYouTubeVideoId(linkOnlyVideo)).toBeNull()
  })

  it('reads a bare url string as the video id, as the legacy widget does', () => {
    const bareId: MediaItem = { type: MediaType.Video, url: '784O9k5_-fc', caption: null }
    expect(getYouTubeVideoId(bareId)).toBe('784O9k5_-fc')
  })

  it('returns null for non-video kinds', () => {
    expect(getYouTubeVideoId(imageItem())).toBeNull()
  })
})

describe('getPosterUrl', () => {
  it('uses the medium size for an image, which is what the widget asks for inline', () => {
    expect(getPosterUrl(imageItem())).toBe('https://example.test/medium.jpg')
  })

  it('uses the video’s own poster frame when it has one', () => {
    expect(getPosterUrl(youTubeItem())).toBe('https://example.test/medium.jpg')
  })

  it('falls back to YouTube’s poster for a video that is only an id', () => {
    const bareId: MediaItem = { type: MediaType.Video, url: '784O9k5_-fc', caption: null }
    expect(getPosterUrl(bareId)).toBe('https://i.ytimg.com/vi/784O9k5_-fc/hqdefault.jpg')
  })

  it('has nothing to show for an external link or a PDF', () => {
    expect(getPosterUrl(externalItem())).toBeNull()
    expect(getPosterUrl(pdfItem())).toBeNull()
  })
})

describe('getCaption', () => {
  it('returns the caption when present', () => {
    expect(getCaption(imageItem('Cornice failure'))).toBe('Cornice failure')
  })

  it('returns null for an empty or missing caption', () => {
    expect(getCaption(imageItem(''))).toBeNull()
    expect(getCaption(imageItem(null))).toBeNull()
    expect(getCaption(pdfItem())).toBeNull()
  })
})

describe('displayableMedia', () => {
  it('keeps every displayable kind', () => {
    const items = [imageItem(), photoItem(), youTubeItem(), externalItem(), pdfItem()]
    expect(displayableMedia(items)).toHaveLength(5)
  })

  it('drops the null and empty media the API returns as placeholders', () => {
    const placeholders: MediaItem[] = [
      { type: null, url: null, caption: '', title: '' },
      { type: MediaType.None, url: '', caption: '' },
      { type: MediaType.Unknown },
    ]
    expect(displayableMedia([imageItem(), ...placeholders])).toEqual([imageItem()])
  })
})

describe('resolveMediaSlide', () => {
  it('prefers an embedded player for a YouTube video', () => {
    expect(resolveMediaSlide(youTubeItem())).toEqual({
      kind: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      title: 'A video',
    })
  })

  it('falls back to a default title when a video has no caption', () => {
    const untitled: MediaItem = {
      type: MediaType.Video,
      url: {
        large: 'https://example.test/large.jpg',
        medium: 'https://example.test/medium.jpg',
        original: 'https://example.test/original.jpg',
        thumbnail: 'https://example.test/thumb.jpg',
        video_id: 'dQw4w9WgXcQ',
      },
      caption: null,
    }
    expect(resolveMediaSlide(untitled)).toMatchObject({ title: 'YouTube video' })
  })

  it('renders a still image as a zoomable photo', () => {
    expect(resolveMediaSlide(imageItem('Slab')).kind).toBe('photo')
    expect(resolveMediaSlide(imageItem('Slab'))).toMatchObject({
      url: 'https://example.test/original.jpg',
      alt: 'Slab',
    })
  })

  // Forecast-125: they open in a new tab from their tile instead.
  it('leaves external media and PDFs out of the lightbox', () => {
    expect(resolveMediaSlide(externalItem())).toEqual({ kind: 'unsupported' })
    expect(resolveMediaSlide(pdfItem())).toEqual({ kind: 'unsupported' })
  })

  it('reports an undisplayable item as unsupported', () => {
    // The schema collapses anything it can't recognise to `unknown`.
    expect(resolveMediaSlide({ type: MediaType.Unknown })).toEqual({ kind: 'unsupported' })
  })
})

// Forecast-125, Forecast-131
describe('getMediaLink', () => {
  it('links external media and PDFs out, with their titles', () => {
    expect(getMediaLink(externalItem('Mt. Glory Snowpit Video'))).toEqual({
      kind: 'external',
      href: 'https://example.test/article',
      title: 'Mt. Glory Snowpit Video',
    })
    expect(getMediaLink(pdfItem('report.pdf'))).toEqual({
      kind: 'pdf',
      href: 'https://example.test/report.pdf',
      title: 'report.pdf',
    })
  })

  it('reads a blank title as none', () => {
    expect(getMediaLink(pdfItem(''))).toMatchObject({ title: null })
    expect(getMediaLink(pdfItem())).toMatchObject({ title: null })
  })

  it('leaves images and videos to the lightbox', () => {
    expect(getMediaLink(imageItem())).toBeNull()
    expect(getMediaLink(youTubeItem())).toBeNull()
  })
})

describe('mediaGridTiles', () => {
  it("keeps the product's order, and numbers the lightbox past the links", () => {
    const media = [imageItem(), pdfItem(), youTubeItem(), externalItem(), photoItem()].map(
      (item) => ({ item }),
    )

    const { tiles, lightbox } = mediaGridTiles(media)

    expect(tiles.map((tile) => (tile.kind === 'link' ? tile.link.kind : tile.index))).toEqual([
      0,
      'pdf',
      1,
      'external',
      2,
    ])
    expect(lightbox.map(({ item }) => item.type)).toEqual([
      MediaType.Image,
      MediaType.Video,
      MediaType.Photo,
    ])
  })
})
