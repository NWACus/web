import { collectEmbeddedMedia } from '@/components/forecast/embeddedMedia'
import { sanitizeHtml } from '@/components/forecast/sanitizeHtml'
import { MediaType } from '@/services/nac/model/forecast'

// Verbatim markup from the live NAC v2 API. Sources: BTAC 184960 (image figure), SNFAC 109444
// (video figure), SNFAC 106477 (empty figcaption), CNFAIC 185366 (figure inside a float wrapper),
// TAC 135278 (the whole discussion wrapped in a div, so no figure is top-level).
const IMAGE_FIGURE =
  '<figure class="image afp-photoswipe">\n<div class="afp-image-container"><img style="width: 700px; height: auto;" src="https://media.test/snowfall-large.png" alt=""></div>\n<figcaption>4/2 - 4/15 Snowfall totals</figcaption>\n</figure>'

const VIDEO_FIGURE =
  '<figure class="image afp-video-modal" style="text-align: center;">\n<div class="afp-image-container afp-video-container"><img style="width: 700px; height: auto;" src="https://media.test/poster.jpg" alt="" data-video-id="p0torRf9boA" /></div>\n<figcaption>(3/25/2022) Join Ethan for a spin through the week.</figcaption>\n</figure>'

const EMPTY_CAPTION_FIGURE =
  '<figure class="image afp-video-modal align-center">\n<div class="afp-image-container afp-video-container"><img src="https://media.test/poster2.jpg" alt="" data-video-id="HcN_MydVTGY" /></div>\n<figcaption spellcheck="false"></figcaption>\n</figure>'

/** Render sanitized HTML into a detached container, the way DiscussionBody does. */
function mount(html: string): HTMLElement {
  const root = document.createElement('div')
  root.innerHTML = sanitizeHtml(html)
  return root
}

describe('collectEmbeddedMedia', () => {
  it('builds an image item from a photoswipe figure', () => {
    const [entry, ...rest] = collectEmbeddedMedia(mount(IMAGE_FIGURE))

    expect(rest).toHaveLength(0)
    expect(entry.isVideo).toBe(false)
    expect(entry.media.item).toEqual({
      type: MediaType.Image,
      caption: '4/2 - 4/15 Snowfall totals',
      url: {
        large: 'https://media.test/snowfall-large.png',
        medium: 'https://media.test/snowfall-large.png',
        original: 'https://media.test/snowfall-large.png',
        thumbnail: 'https://media.test/snowfall-large.png',
      },
    })
  })

  it('builds a video item from the poster image data-video-id', () => {
    const [entry] = collectEmbeddedMedia(mount(VIDEO_FIGURE))

    expect(entry.isVideo).toBe(true)
    expect(entry.media.item.type).toBe(MediaType.Video)
    expect(entry.media.item).toMatchObject({
      url: { video_id: 'p0torRf9boA', original: 'https://media.test/poster.jpg' },
    })
  })

  it('points the icon target at the inner container, as the legacy widget did', () => {
    const [image] = collectEmbeddedMedia(mount(IMAGE_FIGURE))
    const [video] = collectEmbeddedMedia(mount(VIDEO_FIGURE))

    expect(image.iconTarget.className).toBe('afp-image-container')
    expect(video.iconTarget.className).toBe('afp-image-container afp-video-container')
  })

  it('keeps an empty caption as an empty string rather than failing', () => {
    const [entry] = collectEmbeddedMedia(mount(EMPTY_CAPTION_FIGURE))

    expect(entry.media.item.type).toBe(MediaType.Video)
    expect(entry.media.item).toMatchObject({ caption: '' })
  })

  it('keeps caption markup, which the lightbox renders as HTML', () => {
    const [entry] = collectEmbeddedMedia(
      mount(
        '<figure class="afp-photoswipe"><div class="afp-image-container"><img src="/a.png"></div><figcaption><p>Photo: <em>Erik</em></p></figcaption></figure>',
      ),
    )

    expect(entry.media.captionHtml).toBe('<p>Photo: <em>Erik</em></p>')
    expect(entry.media.item).toMatchObject({ caption: '<p>Photo: <em>Erik</em></p>' })
  })

  // The lightbox renders captionHtml with dangerouslySetInnerHTML and no sanitizing of its own —
  // #1234 moved that to the server so the library stays out of the client bundle. What makes this
  // path safe is that the figure is read back out of DOM written from already-sanitized HTML.
  it('yields a caption the server pass has already cleaned', () => {
    const [entry] = collectEmbeddedMedia(
      mount(
        '<figure class="afp-photoswipe"><div class="afp-image-container"><img src="/a.png"></div>' +
          '<figcaption>Photo: <script>alert(1)</script><img src="x" onerror="alert(2)"> Erik</figcaption></figure>',
      ),
    )

    expect(entry.media.captionHtml).not.toContain('script')
    expect(entry.media.captionHtml).not.toContain('onerror')
    expect(entry.media.captionHtml).toContain('Erik')
  })

  it('collects in document order across nesting depths', () => {
    // CNFAIC floats a figure inside an overflow wrapper; TAC wraps the whole discussion in a div.
    const root = mount(
      `<div><p>intro</p>${IMAGE_FIGURE}<div style="overflow: hidden;">${VIDEO_FIGURE}</div></div>`,
    )

    expect(collectEmbeddedMedia(root).map((entry) => entry.isVideo)).toEqual([false, true])
  })

  it('matches the older WordPress editor class names too', () => {
    const root = mount(
      '<figure class="image nac-photoswipe"><div class="afp-image-container"><img src="/a.png"></div><figcaption>c</figcaption></figure>',
    )

    expect(collectEmbeddedMedia(root)).toHaveLength(1)
  })

  it('skips a figure with no image rather than opening an empty lightbox slide', () => {
    const root = mount('<figure class="afp-photoswipe"><figcaption>no image</figcaption></figure>')

    expect(collectEmbeddedMedia(root)).toHaveLength(0)
  })

  it('finds nothing in a discussion with no embedded media', () => {
    expect(collectEmbeddedMedia(mount('<p>Just prose, and an <img src="/loose.png"></p>'))).toEqual(
      [],
    )
  })
})
