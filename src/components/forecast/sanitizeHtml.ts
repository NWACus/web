/**
 * Forecast HTML sanitization using isomorphic-dompurify.
 * More restrictive than GenericEmbedBlock — no scripts, iframes, or forms.
 */
import DOMPurify from 'isomorphic-dompurify'

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

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })
}
