/**
 * Plain text for a `description` / `og:description` from authored HTML, such as a forecast's bottom
 * line. Server-only: it reaches `sanitize-html`, which must stay out of the client bundle.
 */
import sanitizeHtmlLib from 'sanitize-html'

/** Long enough for a bottom line's first sentence or two; link previews clip well before this. */
const DEFAULT_MAX_LENGTH = 300

const ELLIPSIS = '…'

// Any opening or closing block-level tag (and <br>/<hr>), so `</p><p>` doesn't glue two sentences.
const BLOCK_TAG =
  /<\/?(?:p|div|br|hr|li|ul|ol|h[1-6]|blockquote|table|tr|td|th|figure|figcaption)\b[^>]*>/gi

// sanitize-html decodes every entity, then re-escapes exactly these three in its text output.
const RE_ESCAPED = /&(amp|lt|gt);/g
const UNESCAPED: Record<string, string> = { amp: '&', lt: '<', gt: '>' }

// A sentence end: terminal punctuation followed by whitespace.
const SENTENCE_END = /[.!?](?=\s)/g

// Punctuation and spaces left dangling where a cut lands mid-clause, e.g. "slopes, —".
const TRAILING_JOINERS = /[\s,;:–—-]+$/

function htmlToPlainText(html: string): string {
  // `$&` is the matched tag: keep it, with a space in front.
  const spaced = html.replace(BLOCK_TAG, ' $&')
  const escaped = sanitizeHtmlLib(spaced, { allowedTags: [], allowedAttributes: {} })

  return (
    escaped
      .replace(RE_ESCAPED, (entity, name: string) => UNESCAPED[name] ?? entity)
      // Collapses newlines and the U+00A0 that `&nbsp;` decodes to, which `\s` also matches.
      .replace(/\s+/g, ' ')
      .trim()
  )
}

/** The last sentence end at or before `maxLength`, or -1. */
function lastSentenceEnd(text: string, maxLength: number): number {
  let end = -1
  for (const match of text.slice(0, maxLength + 1).matchAll(SENTENCE_END)) {
    end = match.index + 1
  }
  return end
}

/**
 * Cut at a sentence end when one keeps at least half the budget; otherwise at the last word
 * boundary, with an ellipsis so the cut reads as one.
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text

  const sentenceEnd = lastSentenceEnd(text, maxLength)
  if (sentenceEnd >= maxLength / 2) return text.slice(0, sentenceEnd)

  const window = text.slice(0, maxLength - ELLIPSIS.length)
  // The window may already end on a whole word; only back up when it ends mid-word.
  const wordEnd = /\s/.test(text.charAt(window.length)) ? window.length : window.lastIndexOf(' ')
  const cut = wordEnd > 0 ? window.slice(0, wordEnd) : window
  return `${cut.replace(TRAILING_JOINERS, '')}${ELLIPSIS}`
}

/**
 * Strip tags, decode entities, collapse whitespace and truncate. Undefined when nothing is left, so
 * a caller can fall back to another description.
 */
export function htmlToDescription(
  html: string | null | undefined,
  maxLength: number = DEFAULT_MAX_LENGTH,
): string | undefined {
  if (!html) return undefined

  const text = htmlToPlainText(html)
  return text ? truncate(text, maxLength) : undefined
}
