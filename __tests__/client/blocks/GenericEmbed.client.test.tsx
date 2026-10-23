import { GenericEmbedBlockComponent } from '@/blocks/GenericEmbed/Component'
import { render } from '@testing-library/react'
import type { ComponentProps } from 'react'

// The resizer polls the frame's document, which jsdom never loads; only the iframe attributes matter here.
jest.mock('@open-iframe-resizer/react', () => ({
  IframeResizer: (props: ComponentProps<'iframe'>) => <iframe {...props} />,
}))

const SCRIPT_EMBED =
  '<iframe id="avy-web-embed-courses" src="https://avy-fx.org/embeds/courses" height="0"></iframe>' +
  '<script type="module">window.embedRan = true</script>'

const renderBlock = (html: string) =>
  render(
    <GenericEmbedBlockComponent
      blockType="genericEmbed"
      html={html}
      backgroundColor="transparent"
      isLayoutBlock={true}
    />,
  )

const frameOf = (container: HTMLElement) => container.querySelector('iframe[sandbox]')

// Stands in for Chromium, the only engine that ships User-Agent Client Hints.
const actAsChromium = () =>
  Object.defineProperty(navigator, 'userAgentData', { value: { brands: [] }, configurable: true })

describe('GenericEmbedBlockComponent frame source', () => {
  beforeEach(() => {
    // jsdom has no object URLs.
    URL.createObjectURL = jest.fn(() => 'blob:https://avy-fx.org/embed')
    URL.revokeObjectURL = jest.fn()
  })

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'userAgentData')
  })

  it('loads a script embed from a blob URL in Chromium', () => {
    actAsChromium()
    const { container } = renderBlock(SCRIPT_EMBED)

    expect(frameOf(container)?.getAttribute('src')).toBe('blob:https://avy-fx.org/embed')
    expect(frameOf(container)?.hasAttribute('srcdoc')).toBe(false)
  })

  // DuckDuckGo on iOS turns a frame's blob: load into a download and never loads it back.
  it('loads a script embed from srcdoc outside Chromium', () => {
    const { container } = renderBlock(SCRIPT_EMBED)

    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(frameOf(container)?.hasAttribute('src')).toBe(false)
    expect(frameOf(container)?.getAttribute('srcdoc')).toContain('window.embedRan = true')
  })

  it('loads a script-free embed from srcdoc even in Chromium', () => {
    actAsChromium()
    const { container } = renderBlock('<iframe src="https://www.youtube.com/embed/x"></iframe>')

    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(frameOf(container)?.getAttribute('srcdoc')).toContain('youtube.com/embed/x')
  })

  it('revokes the blob URL on unmount', () => {
    actAsChromium()
    const { unmount } = renderBlock(SCRIPT_EMBED)

    unmount()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:https://avy-fx.org/embed')
  })
})
