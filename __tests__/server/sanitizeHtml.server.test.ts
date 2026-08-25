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

    it('keeps a playlist a playlist', () => {
      // `videoseries` is itself 11 characters, so it passes for a video id — without the list
      // param carried over, the rebuilt URL asks YouTube for a video by that name.
      const out = sanitizeHtml(
        '<iframe src="https://www.youtube.com/embed/videoseries?list=PLabcdefghij"></iframe>',
      )
      expect(out).toContain('/embed/videoseries')
      expect(out).toContain('list=PLabcdefghij')
    })

    it('keeps a channel live stream pointed at its channel', () => {
      // `live_stream` is 11 characters too, so it passes for a video id the same way.
      const out = sanitizeHtml(
        '<iframe src="https://www.youtube.com/embed/live_stream?channel=UCPQi3sYr7EA0276Q3vBBhIA"></iframe>',
      )
      expect(out).toContain('/embed/live_stream')
      expect(out).toContain('channel=UCPQi3sYr7EA0276Q3vBBhIA')
    })

    it('keeps a start offset and a Vimeo private-video hash', () => {
      expect(
        sanitizeHtml('<iframe src="https://www.youtube.com/embed/_rYvrxGpBQc?start=120"></iframe>'),
      ).toContain('start=120')
      expect(
        sanitizeHtml('<iframe src="https://player.vimeo.com/video/12345?h=abc123"></iframe>'),
      ).toContain('h=abc123')
    })

    it('drops the share-tracking token', () => {
      const out = sanitizeHtml(
        '<iframe src="https://www.youtube.com/embed/_rYvrxGpBQc?si=TRACKME"></iframe>',
      )
      expect(out).not.toContain('si=')
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

    it('does not frame an unrecognized provider, but says so and names it', () => {
      const out = sanitizeHtml('<p><iframe src="https://vendor.example.com/embed/1"></iframe></p>')
      expect(out).toBe(
        '<p>[Embedded content from vendor.example.com could not be displayed here]</p>',
      )
    })

    it('does not turn a rejected embed URL into a link', () => {
      const out = sanitizeHtml('<p><iframe src="https://vendor.example.com/embed/1"></iframe></p>')
      expect(out).not.toContain('<a')
      expect(out).not.toContain('href')
    })

    it('discards a blocked embed’s fallback markup instead of parsing it as content', () => {
      // A browser never renders an iframe's children, but the parser reads them as live markup —
      // so without this they would smuggle a figure the legacy widget would never have shown.
      const smuggled =
        '<p><iframe src="https://evil.example/e"><figure class="image afp-photoswipe"><div class="afp-image-container"><img src="https://attacker.example/a.jpg" data-video-id="dQw4w9WgXcQ"></div><figcaption>FAKE FORECAST UPDATE</figcaption></figure></iframe></p>'
      const out = sanitizeHtml(smuggled)
      expect(out).not.toContain('afp-photoswipe')
      expect(out).not.toContain('attacker.example')
      expect(out).not.toContain('FAKE FORECAST UPDATE')
    })

    it('drops an iframe with nothing identifiable to name', () => {
      expect(
        sanitizeHtml('<p><iframe src="javascript:alert(1)">Cannot play this</iframe></p>'),
      ).toBe('<p></p>')
      expect(sanitizeHtml('<p><iframe src="/local/thing"></iframe></p>')).toBe('<p></p>')
      expect(sanitizeHtml('<p><iframe></iframe></p>')).toBe('<p></p>')
    })

    it('still drops script contents, which nonTextTags also governs', () => {
      expect(sanitizeHtml('<script>alert(1)</script><p>Safe</p>')).toBe('<p>Safe</p>')
      expect(sanitizeHtml('<style>body{}</style><p>Safe</p>')).toBe('<p>Safe</p>')
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
