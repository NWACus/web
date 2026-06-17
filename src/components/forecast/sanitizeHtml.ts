/**
 * Forecast HTML sanitization using sanitize-html.
 *
 * Pure JS with no DOM dependency, so it runs in server components. (DOMPurify
 * would need jsdom on the server, which does not survive Next's server bundle.)
 * More restrictive than GenericEmbedBlock — no scripts, iframes, or forms.
 */
import sanitizeHtmlLib from 'sanitize-html'

const ALLOWED_TAGS = [
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'img',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'strong',
  'em',
  'br',
  'figure',
  'figcaption',
  'span',
  'div',
  'sup',
  'sub',
]

const ALLOWED_ATTR = ['href', 'src', 'alt', 'class', 'style']

// Absolute (http/https) and protocol-relative URLs point off the AvyWeb tenant
// site. All forecast HTML comes from the NAC API, so any absolute link is to
// another domain; open those in a new tab. Relative links stay in the same tab.
const isExternalUrl = (href: string | undefined): boolean => !!href && /^(https?:)?\/\//i.test(href)

export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      '*': ALLOWED_ATTR,
      a: [...ALLOWED_ATTR, 'target', 'rel'],
    },
    transformTags: {
      a: (tagName, attribs) =>
        isExternalUrl(attribs.href)
          ? { tagName, attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' } }
          : { tagName, attribs },
    },
  })
}
