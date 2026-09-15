import { DiscussionBody } from '@/components/forecast/DiscussionBody'
import { ForecastDiscussion } from '@/components/forecast/ForecastDiscussion'
import { sanitizeHtml } from '@/components/forecast/sanitizeHtml'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import { expectCaptionsSanitized } from '../../captionSanitization'

// Verbatim markup from the live NAC v2 API. Sources: BTAC 184960, SNFAC 109444, TAC 181191.
const IMAGE_FIGURE =
  '<figure class="image afp-photoswipe">\n<div class="afp-image-container"><img style="width: 700px; height: auto;" src="https://media.test/snowfall-large.png" alt=""></div>\n<figcaption>Snowfall totals</figcaption>\n</figure>'

const VIDEO_FIGURE =
  '<figure class="image afp-video-modal">\n<div class="afp-image-container afp-video-container"><img src="https://media.test/poster.jpg" alt="" data-video-id="p0torRf9boA" /></div>\n<figcaption>Weekly video</figcaption>\n</figure>'

const YOUTUBE_IFRAME =
  '<p><iframe title="Reactive Slab" src="https://www.youtube.com/embed/_rYvrxGpBQc" width="1062" height="597" frameborder="0" allowfullscreen="allowfullscreen"></iframe></p>'

const renderDiscussion = (html: string) => render(<DiscussionBody html={sanitizeHtml(html)} />)

describe('DiscussionBody', () => {
  it('renders authored prose untouched', () => {
    renderDiscussion('<p>Watch for wind slabs on north aspects.</p>')

    expect(screen.getByText('Watch for wind slabs on north aspects.')).toBeInTheDocument()
  })

  it('renders a forecaster-embedded YouTube video rather than dropping it', () => {
    const { container } = renderDiscussion(YOUTUBE_IFRAME)

    const iframe = container.querySelector('iframe')
    expect(iframe).toBeInTheDocument()
    expect(iframe?.getAttribute('src')).toContain('/embed/_rYvrxGpBQc')
  })

  it('adds no controls when nothing is embedded', () => {
    renderDiscussion('<p>Just prose.</p>')

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('makes an embedded image expandable', () => {
    renderDiscussion(IMAGE_FIGURE)

    expect(screen.getByRole('button', { name: 'Expand embedded image' })).toBeInTheDocument()
  })

  it('marks an embedded video as playable', () => {
    renderDiscussion(VIDEO_FIGURE)

    expect(screen.getByRole('button', { name: 'Play embedded video' })).toBeInTheDocument()
  })

  it('opens the lightbox on the figure that was clicked', async () => {
    renderDiscussion(`${IMAGE_FIGURE}<p>between</p>${VIDEO_FIGURE}`)

    fireEvent.click(screen.getByRole('button', { name: 'Play embedded video' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTitle('Weekly video')).toHaveAttribute(
      'src',
      expect.stringContaining('p0torRf9boA'),
    )
  })

  it('opens the lightbox when the figure itself is clicked, as the legacy widget did', async () => {
    const { container } = renderDiscussion(IMAGE_FIGURE)

    const caption = container.querySelector('figcaption')
    expect(caption).not.toBeNull()
    if (caption) fireEvent.click(caption)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('keeps the affordances after opening the lightbox', async () => {
    renderDiscussion(IMAGE_FIGURE)

    fireEvent.click(screen.getByRole('button', { name: 'Expand embedded image' }))
    await screen.findByRole('dialog')

    // React rewrites a dangerouslySetInnerHTML subtree on any re-render, which would detach the
    // collected figures and strand their overlays in orphaned nodes. The rendered HTML is memoized
    // to prevent that. (The open dialog marks the page behind it hidden, hence `hidden: true`.)
    expect(
      screen.getByRole('button', { name: 'Expand embedded image', hidden: true }),
    ).toBeInTheDocument()
  })

  it('re-collects when a corrected forecast replaces the discussion', () => {
    const { rerender } = renderDiscussion(IMAGE_FIGURE)
    expect(screen.getByRole('button', { name: 'Expand embedded image' })).toBeInTheDocument()

    rerender(<DiscussionBody html={sanitizeHtml(`${IMAGE_FIGURE}${VIDEO_FIGURE}`)} />)

    expect(screen.getAllByRole('button', { name: 'Expand embedded image' })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Play embedded video' })).toBeInTheDocument()
  })

  it('leaves the poster image itself clickable, so its context menu still works', () => {
    const { container } = renderDiscussion(IMAGE_FIGURE)

    const overlay = container.querySelector('.afp-image-container > span')
    expect(overlay).toHaveClass('pointer-events-none')
  })

  /**
   * The third way a caption reaches the lightbox, and the one that is safe without a sanitize call
   * of its own: `collectEmbeddedMedia` reads the figcaption back out of the DOM this component
   * wrote, and what it wrote was sanitized upstream. Rendered through `ForecastDiscussion` so that
   * upstream pass is the real one, and the assertion is on the caption the lightbox opens with.
   */
  it('opens an embedded figure with a caption the server pass already cleaned', async () => {
    render(
      <ForecastDiscussion
        html={
          '<figure class="afp-photoswipe"><div class="afp-image-container"><img src="/a.png"></div>' +
          '<figcaption>Photo: <script>alert(1)</script><img src="y" onerror="alert(2)"> Erik</figcaption></figure>'
        }
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Expand embedded image' }))
    await screen.findByRole('dialog')

    // Two renderers: the figcaption on the page, and the lightbox footer.
    expectCaptionsSanitized(2)
  })

  it('lets a link inside a figure navigate instead of opening the lightbox', async () => {
    const { container } = renderDiscussion(
      '<figure class="afp-photoswipe"><div class="afp-image-container"><img src="/a.png"></div><figcaption>Photo: <a href="https://example.test/who">Erik</a></figcaption></figure>',
    )

    const link = container.querySelector('figcaption a')
    expect(link).not.toBeNull()
    if (link) fireEvent.click(link)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
