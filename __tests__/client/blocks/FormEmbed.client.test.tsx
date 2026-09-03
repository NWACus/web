import { FORM_EMBED_POLICY, FormEmbedBlockComponent } from '@/blocks/FormEmbed/Component'
import { act, render } from '@testing-library/react'
import DOMPurify from 'dompurify'

// Sanitize the same way the block does so the policy is exercised against real provider snippets.
const sanitize = (html: string) =>
  DOMPurify.sanitize(html, {
    ADD_TAGS: FORM_EMBED_POLICY.addTags,
    ADD_ATTR: FORM_EMBED_POLICY.addAttr,
    FORCE_BODY: true,
  })

// A real GoFundMe Pro snippet. The `classy` attribute is the provider's own — GoFundMe Pro is the
// former Classy product — so the policy has to let it through verbatim.
const GOFUNDME_SNIPPET =
  '<script async="" src="https://giving.gofundme.com/embedded/api/checkout/sdk/js/84977"></script>' +
  '<div id="nnaqF4a0O1iSXBsTk93L2" classy="802015"></div>'

describe('FORM_EMBED_POLICY sanitization', () => {
  it('keeps the GoFundMe Pro embed snippet intact', () => {
    const sanitized = sanitize(GOFUNDME_SNIPPET)

    expect(sanitized).toContain(
      '<script async="" src="https://giving.gofundme.com/embedded/api/checkout/sdk/js/84977">',
    )
    expect(sanitized).toContain('id="nnaqF4a0O1iSXBsTk93L2"')
    expect(sanitized).toContain('classy="802015"')
  })

  it('keeps the DonorBox embed snippet intact', () => {
    const sanitized = sanitize(
      '<script src="https://donorbox.org/widget.js" paypalexpress="false"></script>' +
        '<iframe src="https://donorbox.org/embed/example" name="donorbox" allowpaymentrequest="allowpaymentrequest" seamless="seamless" frameborder="0" scrolling="no" height="900px" width="100%"></iframe>',
    )

    expect(sanitized).toContain('<iframe')
    expect(sanitized).toContain('allowpaymentrequest="allowpaymentrequest"')
    expect(sanitized).toContain('src="https://donorbox.org/embed/example"')
  })

  it('strips event-handler attributes', () => {
    const sanitized = sanitize('<div id="embed-root" onclick="alert(1)"></div>')

    expect(sanitized).toContain('id="embed-root"')
    expect(sanitized).not.toContain('onclick')
  })
})

describe('FormEmbedBlockComponent', () => {
  const renderBlock = (html: string) =>
    render(
      <FormEmbedBlockComponent
        blockType="formEmbed"
        html={html}
        backgroundColor="transparent"
        isLayoutBlock={true}
      />,
    )

  // Checkout SDKs need a rewritable document URL and a full-viewport overlay, so this block
  // renders in the page rather than in a sandboxed iframe. See docs/decisions/017-form-embeds-in-page.md.
  it('renders the embed in the page rather than in an iframe', () => {
    const { container } = renderBlock(GOFUNDME_SNIPPET)

    expect(container.querySelector('iframe')).toBeNull()
    expect(container.querySelector('#nnaqF4a0O1iSXBsTk93L2')?.getAttribute('classy')).toBe('802015')
  })

  it('rebuilds provider script tags so the browser executes them', () => {
    const { container } = renderBlock(GOFUNDME_SNIPPET)

    const script = container.querySelector('script')
    // A <script> parsed out of a string is inert; only a freshly created element runs.
    expect(script?.src).toBe('https://giving.gofundme.com/embedded/api/checkout/sdk/js/84977')
    expect(script?.hasAttribute('async')).toBe(true)
  })

  it('rebuilds scripts nested inside a wrapper element', () => {
    const { container } = renderBlock(
      '<div id="embed-root"><script src="https://donorbox.org/widget.js"></script></div>',
    )

    const script = container.querySelector('#embed-root')?.querySelector('script')
    expect(script?.src).toBe('https://donorbox.org/widget.js')
    // Inserted scripts default to async; a snippet that didn't ask for it keeps declaration order.
    expect(script?.async).toBe(false)
  })

  it('drops markup the sanitize policy rejects', () => {
    const { container } = renderBlock(
      '<div id="embed-root" onclick="alert(1)"></div><object></object>',
    )

    expect(container.querySelector('#embed-root')?.getAttribute('onclick')).toBeNull()
    expect(container.querySelector('object')).toBeNull()
  })

  it('clears the previous snippet when the embed code changes', () => {
    const { container, rerender } = renderBlock(GOFUNDME_SNIPPET)

    expect(container.querySelector('#nnaqF4a0O1iSXBsTk93L2')).not.toBeNull()

    rerender(
      <FormEmbedBlockComponent
        blockType="formEmbed"
        html='<div id="replacement"></div>'
        backgroundColor="transparent"
        isLayoutBlock={true}
      />,
    )

    expect(container.querySelector('#nnaqF4a0O1iSXBsTk93L2')).toBeNull()
    expect(container.querySelector('#replacement')).not.toBeNull()
  })

  it('confines provider CSS to its own embed', () => {
    const { container } = renderBlock(
      '<style>html, body { font-family: Lato; }</style><div id="in-embed"></div>',
    )

    const scopeId = container.querySelector('[data-form-embed]')?.getAttribute('data-form-embed')
    expect(scopeId).toBeTruthy()
    // Rules only match inside the scoping root, so `html, body` matches nothing once wrapped.
    expect(container.querySelector('style')?.textContent).toBe(
      `@scope ([data-form-embed="${scopeId}"]) {\nhtml, body { font-family: Lato; }\n}`,
    )
  })

  it('gives each embed on a page its own scope', () => {
    const { container } = render(
      <>
        <FormEmbedBlockComponent
          blockType="formEmbed"
          html="<style>h2 { margin: 0; }</style>"
          backgroundColor="transparent"
          isLayoutBlock={true}
        />
        <FormEmbedBlockComponent
          blockType="formEmbed"
          html="<style>h2 { margin: 0; }</style>"
          backgroundColor="transparent"
          isLayoutBlock={true}
        />
      </>,
    )

    const [first, second] = Array.from(container.querySelectorAll('[data-form-embed]'))
    expect(first.getAttribute('data-form-embed')).not.toBe(second.getAttribute('data-form-embed'))
  })
})

// The four snippets below are the `settings.footerForm.html` values in production, trimmed to the
// markup under test (every CSS rule and <script> is verbatim; repeated form fields are not). The
// footer renders this block on every page, so a snippet that leaks styles leaks them site-wide.
describe('FormEmbedBlockComponent with production footer snippets', () => {
  const renderBlock = (html: string) =>
    render(
      <FormEmbedBlockComponent
        blockType="formEmbed"
        html={html}
        backgroundColor="transparent"
        isLayoutBlock={false}
      />,
    )

  const scopeOf = (container: HTMLElement) =>
    container.querySelector('[data-form-embed]')?.getAttribute('data-form-embed')

  // jsdom executes a <script> imported out of a <template>; a real browser leaves it inert until
  // the block rebuilds it (verified in Chrome). Stub the global the loader would have supplied so
  // that jsdom-only execution doesn't throw.
  beforeEach(() => {
    Object.assign(window, { jQuery: { noConflict: () => ({}) } })
  })

  // Restores document.createElement so the next spy doesn't wrap the previous one.
  afterEach(() => jest.restoreAllMocks())

  // Collects the <script> elements the block builds, which is what tells a rebuilt script apart
  // from the inert one it replaces.
  const captureBuiltScripts = () => {
    const created: HTMLScriptElement[] = []
    const realCreateElement = document.createElement.bind(document)
    jest.spyOn(document, 'createElement').mockImplementation((tag, options) => {
      const el = realCreateElement(tag, options)
      if (el instanceof HTMLScriptElement) created.push(el)
      return el
    })
    return created
  }

  it('NWAC: renders the bare iframe with no scripts or styles', () => {
    const { container } = renderBlock(
      '<iframe src="https://welcome.nwac.us/l/935893/2021-08-03/xnp" width="100%" height="auto" type="text/html" frameborder="0" allowTransparency="true" style="border: 0"></iframe>',
    )

    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://welcome.nwac.us/l/935893/2021-08-03/xnp',
    )
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('style')).toBeNull()
  })

  it('SAC: keeps the ID-scoped Mailchimp CSS working inside the embed', () => {
    const { container } = renderBlock(
      '<div id="mc_embed_shell">' +
        '<style type="text/css">' +
        "#mc_embed_signup {font-family: 'Lato', sans-serif;}" +
        '#mc_embed_signup input{padding:10px 20px;color:#666666;border-radius:4px;margin-top:10px;}' +
        '#mc-embedded-subscribe{background-color:#1781b9;color:#fff!important;padding:10px 20px;}' +
        '</style>' +
        '<div id="mc_embed_signup"><form action="https://sierraavalanchecenter.us9.list-manage.com/subscribe/post" method="post"><input name="EMAIL" type="email"></form></div>' +
        '</div>',
    )

    const css = container.querySelector('style')?.textContent
    expect(css).toContain(`@scope ([data-form-embed="${scopeOf(container)}"]) {`)
    // The provider's own selectors survive untouched inside the wrapper.
    expect(css).toContain('#mc_embed_signup input{padding:10px 20px;')
    expect(container.querySelector('form')?.getAttribute('action')).toBe(
      'https://sierraavalanchecenter.us9.list-manage.com/subscribe/post',
    )
  })

  it('PAC: scopes the Mailchimp CSS', () => {
    const { container } = renderBlock(
      '<div id="mc_embed_shell">' +
        '<style type="text/css">' +
        '#mc_embed_signup input { padding: 10px 20px; color: #666666; border-radius: 4px; margin-top: 10px; }' +
        '#emailsubmit { background-color: hsl(43 96% 50%); padding: 10px 20px; }' +
        '</style>' +
        '<form action="https://payetteavalanche.us7.list-manage.com/subscribe/post" method="post"><input id="mce-EMAIL" type="email"></form>' +
        '</div>',
    )

    expect(container.querySelector('style')?.textContent).toContain(
      `@scope ([data-form-embed="${scopeOf(container)}"]) {`,
    )
    expect(container.querySelector('#emailsubmit')).toBeNull()
    expect(container.querySelector('form')).not.toBeNull()
  })

  // The one production snippet that would have restyled the whole site: bare `html, body` plus an
  // `input, label, h2` override with !important, on a block the footer renders on every page.
  const SNFAC_SNIPPET =
    '<div id="mc_embed_shell" style="width:100%; height:auto;">' +
    '<link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap" rel="stylesheet">' +
    '<link href="//cdn-images.mailchimp.com/embedcode/classic-061523.css" rel="stylesheet" type="text/css">' +
    '<style type="text/css">' +
    "html, body { margin: 0; padding: 0; width: 100%; font-family: 'Lato', Lato, sans-serif; }" +
    '#mc_embed_signup { width: 100% !important; height: auto !important; display: block; }' +
    'input, label, h2, .mc-field-group { font: inherit !important; box-sizing: border-box; margin: 0 !important; padding: 0.5rem 0 !important; }' +
    'label { display: none !important; }' +
    '</style>' +
    '<div id="mc_embed_signup"><form action="https://sawtoothavalanche.us16.list-manage.com/subscribe/post" method="post"><input type="email" name="EMAIL"></form></div>' +
    '</div>' +
    '<script src="//s3.amazonaws.com/downloads.mailchimp.com/js/mc-validate.js" type="text/javascript"></script>' +
    '<script type="text/javascript">var $mcj = jQuery.noConflict(true);</script>'

  it('SNFAC: confines the site-wide CSS rules to the embed', () => {
    const { container } = renderBlock(SNFAC_SNIPPET)

    const css = container.querySelector('style')?.textContent ?? ''
    expect(css).toContain(`@scope ([data-form-embed="${scopeOf(container)}"]) {`)
    // `html, body` and the !important overrides survive, but only as scoped rules — inside the
    // wrapper they match nothing outside this embed.
    expect(css).toContain('html, body { margin: 0;')
    expect(css).toContain('input, label, h2, .mc-field-group { font: inherit !important;')
    expect(css.indexOf('@scope')).toBeLessThan(css.indexOf('html, body'))
  })

  it('SNFAC: strips the stylesheet links the policy does not allow', () => {
    const { container } = renderBlock(SNFAC_SNIPPET)

    expect(container.querySelector('link')).toBeNull()
  })

  it('SNFAC: holds the inline call until the loader it depends on has finished', async () => {
    const created = captureBuiltScripts()

    renderBlock(SNFAC_SNIPPET)

    // Only the loader has been rebuilt so far. The inline half calls into the global that loader
    // defines, and under the HTML parser a blocking external script held back everything after it.
    expect(created).toHaveLength(1)
    // The snippet's src is protocol-relative, so match on the path rather than the resolved scheme.
    expect(created[0].src).toContain('s3.amazonaws.com/downloads.mailchimp.com/js/mc-validate.js')
    expect(created[0].async).toBe(false)

    await act(async () => {
      created[0].dispatchEvent(new Event('load'))
    })

    // A <script> parsed out of a string is inert, so each one is replaced by a fresh element.
    expect(created).toHaveLength(2)
    expect(created[1].src).toBe('')
    expect(created[1].textContent).toContain('jQuery.noConflict')
  })

  it('SNFAC: does not strand the rest of the snippet when the loader fails', async () => {
    const created = captureBuiltScripts()

    renderBlock(SNFAC_SNIPPET)

    await act(async () => {
      created[0].dispatchEvent(new Event('error'))
    })

    expect(created).toHaveLength(2)
  })
})
