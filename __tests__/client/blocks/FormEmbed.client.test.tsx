import { FORM_EMBED_POLICY } from '@/blocks/FormEmbed/Component'
import DOMPurify from 'dompurify'

// Sanitize the same way EmbedFrame does so the policy is exercised against real provider snippets.
const sanitize = (html: string) =>
  DOMPurify.sanitize(html, {
    ADD_TAGS: FORM_EMBED_POLICY.addTags,
    ADD_ATTR: FORM_EMBED_POLICY.addAttr,
    FORCE_BODY: true,
  })

describe('FORM_EMBED_POLICY sanitization', () => {
  it('keeps the GoFundMe Pro (Classy) embed snippet intact', () => {
    const sanitized = sanitize(
      '<script async="" src="https://giving.gofundme.com/embedded/api/checkout/sdk/js/84977"></script>' +
        '<div id="nnaqF4a0O1iSXBsTk93L2" classy="802015"></div>',
    )

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
    const sanitized = sanitize('<div classy="802015" onclick="alert(1)"></div>')

    expect(sanitized).toContain('classy="802015"')
    expect(sanitized).not.toContain('onclick')
  })
})
