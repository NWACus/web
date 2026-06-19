import { getYouTubeEmbedUrl, getYouTubeId, getYouTubeThumbnail } from '@/utilities/youtube'

describe('getYouTubeId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['  https://youtu.be/dQw4w9WgXcQ  ', 'dQw4w9WgXcQ'],
    ['dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('parses %s', (url, expected) => {
    expect(getYouTubeId(url)).toBe(expected)
  })

  it.each([
    [''],
    [null],
    [undefined],
    ['https://example.com/watch?v=dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=tooshort'],
    ['https://www.youtube.com/'],
    ['not a url'],
  ])('returns null for %s', (url) => {
    expect(getYouTubeId(url)).toBeNull()
  })
})

describe('getYouTubeThumbnail', () => {
  it('builds a thumbnail URL', () => {
    expect(getYouTubeThumbnail('dQw4w9WgXcQ')).toBe(
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    )
  })
})

describe('getYouTubeEmbedUrl', () => {
  it('builds a nocookie embed URL without autoplay by default', () => {
    const url = getYouTubeEmbedUrl('dQw4w9WgXcQ')
    expect(url).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(url).not.toContain('autoplay=1')
  })

  it('adds autoplay when requested', () => {
    expect(getYouTubeEmbedUrl('dQw4w9WgXcQ', true)).toContain('autoplay=1')
  })
})
