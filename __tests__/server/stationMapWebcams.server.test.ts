import { youtubeEmbedUrl } from '@/services/snowobs/stationMap/webcams'

describe('youtubeEmbedUrl', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/live/dQw4w9WgXcQ?feature=share',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
  ])('embeds %s', (url) => {
    expect(youtubeEmbedUrl(url)).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  it('is null for anything that is not a YouTube video', () => {
    expect(youtubeEmbedUrl('https://images.wsdot.wa.gov/sc/090VC05130.jpg')).toBeNull()
    expect(youtubeEmbedUrl('https://www.youtube.com/')).toBeNull()
  })
})
