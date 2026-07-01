import { getVideoEmbedUrl, getVideoThumbnail, parseVideoUrl } from '@/utilities/videoEmbed'

describe('parseVideoUrl', () => {
  it('parses YouTube watch, short, embed, and shorts URLs', () => {
    expect(parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
      provider: 'youtube',
      id: 'dQw4w9WgXcQ',
    })
    expect(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ')).toEqual({
      provider: 'youtube',
      id: 'dQw4w9WgXcQ',
    })
    expect(parseVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toEqual({
      provider: 'youtube',
      id: 'dQw4w9WgXcQ',
    })
    expect(parseVideoUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toEqual({
      provider: 'youtube',
      id: 'dQw4w9WgXcQ',
    })
  })

  it('parses Vimeo URLs', () => {
    expect(parseVideoUrl('https://vimeo.com/76979871')).toEqual({
      provider: 'vimeo',
      id: '76979871',
    })
    expect(parseVideoUrl('https://player.vimeo.com/video/76979871')).toEqual({
      provider: 'vimeo',
      id: '76979871',
    })
  })

  it('accepts a bare YouTube ID and rejects unsupported or junk URLs', () => {
    expect(parseVideoUrl('dQw4w9WgXcQ')).toEqual({ provider: 'youtube', id: 'dQw4w9WgXcQ' })
    expect(parseVideoUrl('https://www.tiktok.com/@espn/video/7448294804259163423')).toBeNull()
    expect(parseVideoUrl('https://www.instagram.com/reel/CXyz_123-AB/')).toBeNull()
    expect(parseVideoUrl('https://example.com/video/123')).toBeNull()
    expect(parseVideoUrl('not a url')).toBeNull()
    expect(parseVideoUrl('')).toBeNull()
    expect(parseVideoUrl(null)).toBeNull()
  })
})

describe('getVideoEmbedUrl', () => {
  it('builds provider-specific embed URLs', () => {
    expect(getVideoEmbedUrl({ provider: 'youtube', id: 'abc12345678' }, true)).toBe(
      'https://www.youtube-nocookie.com/embed/abc12345678?rel=0&autoplay=1',
    )
    expect(getVideoEmbedUrl({ provider: 'vimeo', id: '76979871' }, true)).toBe(
      'https://player.vimeo.com/video/76979871?autoplay=1',
    )
    expect(getVideoEmbedUrl({ provider: 'vimeo', id: '76979871' })).toBe(
      'https://player.vimeo.com/video/76979871',
    )
  })
})

describe('getVideoThumbnail', () => {
  it('returns a static thumbnail only for YouTube', () => {
    expect(getVideoThumbnail({ provider: 'youtube', id: 'abc12345678' })).toBe(
      'https://i.ytimg.com/vi/abc12345678/hqdefault.jpg',
    )
    expect(getVideoThumbnail({ provider: 'vimeo', id: '76979871' })).toBeNull()
  })
})
