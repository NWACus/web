import { sanitizeHtml } from '@/components/forecast/sanitizeHtml'

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
})
