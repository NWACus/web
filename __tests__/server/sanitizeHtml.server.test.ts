import { sanitizeHtml } from '@/components/forecast/sanitizeHtml'

// Verbatim markup from the live NAC v2 API, so the cases below stay honest about what forecasters
// actually author. Sources: TAC 181191 (YouTube), IPAC 98592 (Facebook), SNFAC 109444 (video
// figure), BTAC 184960 (image figure).
const REAL_YOUTUBE_IFRAME =
  '<p><iframe title="Reactive Slab on top of a shallow weak faceted snowpack" src="https://www.youtube.com/embed/_rYvrxGpBQc" width="1062" height="597" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen="allowfullscreen"></iframe></p>'

const REAL_FACEBOOK_IFRAME =
  '<p><iframe src="https://www.facebook.com/plugins/video.php?height=476&amp;href=https%3A%2F%2Fwww.facebook.com%2Ffriendsofipac%2Fvideos%2F231581138660558%2F&amp;show_text=false&amp;width=267" width="267" height="476" frameborder="0" allowfullscreen="true" scrolling="no"></iframe></p>'

const REAL_VIDEO_FIGURE =
  '<figure class="image afp-video-modal" style="text-align: center;">\n<div class="afp-image-container afp-video-container"><img style="width: 700px; height: auto;" src="https://avalanche-org-media.s3.us-west-2.amazonaws.com/p0torRf9boA_623df057e590f.jpg" alt="" data-video-id="p0torRf9boA" /></div>\n<figcaption>(3/25/2022) Join Ethan for a spin through the week&rsquo;s warm weather.</figcaption>\n</figure>'

const REAL_IMAGE_FIGURE =
  '<figure class="image afp-photoswipe">\n<div class="afp-image-container"><img style="width: 1228px; height: 444px;" src="https://avalanche-org-media.s3.us-west-2.amazonaws.com/Early%20April%20Snowfall%20Graph_69dfc5b63e53b-large.png" alt=""></div>\n<figcaption>4/2 - 4/15 Snowfall totals by day from Raymer Bowl at JHMR</figcaption>\n</figure>'

describe('sanitizeHtml', () => {
  it('opens external (other-domain) links in a new tab with a safe rel', () => {
    const out = sanitizeHtml('<p>See <a href="https://nwac.us/foo">NWAC</a></p>')
    expect(out).toContain('href="https://nwac.us/foo"')
    expect(out).toContain('target="_blank"')
    expect(out).toContain('rel="noopener noreferrer"')
  })

  it('treats protocol-relative URLs as external', () => {
    const out = sanitizeHtml('<a href="//example.com/x">x</a>')
    expect(out).toContain('target="_blank"')
  })

  it('leaves relative links in the same tab (no target)', () => {
    const out = sanitizeHtml('<a href="/forecasts/avalanche/olympics">zone</a>')
    expect(out).not.toContain('target="_blank"')
  })

  it('strips disallowed tags but keeps their text content', () => {
    const out = sanitizeHtml('<script>alert(1)</script><p>Safe <strong>text</strong></p>')
    expect(out).not.toContain('<script')
    expect(out).toContain('<strong>text</strong>')
    expect(out).toContain('Safe')
  })

  it('strips forms', () => {
    const out = sanitizeHtml('<form action="/x"><input name="a"></form><p>Safe</p>')
    expect(out).not.toContain('<form')
    expect(out).not.toContain('<input')
    expect(out).toContain('<p>Safe</p>')
  })

  describe('embedded video', () => {
    it('keeps a forecaster-embedded YouTube iframe', () => {
      const out = sanitizeHtml(REAL_YOUTUBE_IFRAME)
      expect(out).toContain('<iframe')
      expect(out).toContain('/embed/_rYvrxGpBQc')
      expect(out).toContain('allowfullscreen')
      expect(out).toContain('title="Reactive Slab on top of a shallow weak faceted snowpack"')
    })

    it('keeps a forecaster-embedded Facebook video plugin', () => {
      const out = sanitizeHtml(REAL_FACEBOOK_IFRAME)
      expect(out).toContain('<iframe')
      expect(out).toContain('https://www.facebook.com/plugins/video.php')
    })

    it('keeps a Vimeo player embed', () => {
      const out = sanitizeHtml(
        '<p><iframe src="https://player.vimeo.com/video/12345"></iframe></p>',
      )
      expect(out).toContain('src="https://player.vimeo.com/video/12345"')
    })

    it('sizes the frame by the authored aspect ratio instead of its pixel height', () => {
      expect(sanitizeHtml(REAL_YOUTUBE_IFRAME)).toContain('aspect-ratio:1062 / 597')
      expect(sanitizeHtml(REAL_FACEBOOK_IFRAME)).toContain('aspect-ratio:267 / 476')
    })

    it('falls back to 16:9 when the authored dimensions are not pixel values', () => {
      const out = sanitizeHtml(
        '<iframe src="https://www.youtube.com/embed/_rYvrxGpBQc" width="100%"></iframe>',
      )
      expect(out).toContain('aspect-ratio:16 / 9')
    })

    it('drops the authored allow/frameborder/scrolling in favor of a fixed policy', () => {
      const out = sanitizeHtml(REAL_FACEBOOK_IFRAME)
      expect(out).not.toContain('frameborder')
      expect(out).not.toContain('scrolling')
      expect(out).toContain('allow="accelerometer; autoplay;')
    })

    it('does not frame facebook.com outside its embed plugins', () => {
      const out = sanitizeHtml('<p><iframe src="https://www.facebook.com/login.php"></iframe></p>')
      expect(out).not.toContain('<iframe')
    })

    it('does not frame the Facebook social widgets, only its content embeds', () => {
      const out = sanitizeHtml(
        '<p><iframe src="https://www.facebook.com/plugins/like.php?href=x"></iframe></p>',
      )
      expect(out).not.toContain('<iframe')
    })

    it('does not frame an http Facebook embed, which would be blocked as mixed content', () => {
      const out = sanitizeHtml(
        '<p><iframe src="http://www.facebook.com/plugins/video.php?href=x"></iframe></p>',
      )
      expect(out).not.toContain('<iframe')
    })

    it('does not frame an unrecognized provider, but names it and leaves a link', () => {
      const out = sanitizeHtml('<p><iframe src="https://vendor.example.com/embed/1"></iframe></p>')
      expect(out).not.toContain('<iframe')
      expect(out).toContain('href="https://vendor.example.com/embed/1"')
      expect(out).toContain('Open embedded content from vendor.example.com')
      expect(out).toContain('rel="noopener noreferrer"')
    })

    it('replaces a blocked embed’s fallback content rather than leaking it', () => {
      const out = sanitizeHtml(
        '<p><iframe src="javascript:alert(1)">Your browser cannot play this</iframe></p>',
      )
      expect(out).toBe('<p></p>')
    })

    it('drops an iframe with no linkable src', () => {
      expect(sanitizeHtml('<p><iframe src="javascript:alert(1)"></iframe></p>')).toBe('<p></p>')
      expect(sanitizeHtml('<p><iframe src="/local/thing"></iframe></p>')).toBe('<p></p>')
      expect(sanitizeHtml('<p><iframe></iframe></p>')).toBe('<p></p>')
    })

    it('does not treat a bare 11-character src as a YouTube id', () => {
      expect(sanitizeHtml('<p><iframe src="abcdefghijk"></iframe></p>')).toBe('<p></p>')
    })
  })

  describe('embedded images', () => {
    it('keeps the video id the embedded-media collector reads', () => {
      const out = sanitizeHtml(REAL_VIDEO_FIGURE)
      expect(out).toContain('data-video-id="p0torRf9boA"')
      expect(out).toContain('class="image afp-video-modal"')
      expect(out).toContain('class="afp-image-container afp-video-container"')
      expect(out).toContain('<figcaption>')
    })

    it('drops the authored pixel height so a clamped image keeps its aspect ratio', () => {
      const out = sanitizeHtml(REAL_IMAGE_FIGURE)
      expect(out).toContain('width:1228px')
      expect(out).not.toContain('height:444px')
    })

    it('leaves other inline styles, including ones that merely end in "height"', () => {
      const out = sanitizeHtml('<img src="/a.png" style="line-height: 2; max-height: 10px">')
      expect(out).toContain('line-height:2')
      expect(out).toContain('max-height:10px')
    })

    it('drops the style attribute entirely when height was all it carried', () => {
      expect(sanitizeHtml('<img src="/a.png" style="height: 40px">')).not.toContain('style')
    })
  })
})
