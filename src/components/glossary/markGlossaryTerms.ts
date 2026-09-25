import { normalizeGlossaryText, type GlossaryEntry } from '@/services/glossary/glossaryEntry'

/** Marks a wrapped term; its value is the entry's index in the term list. */
export const TERM_ATTR = 'data-glossary-term'
/** Marks the element the open popover is portaled into, so a re-mark pass never descends into it. */
export const POPOVER_ATTR = 'data-glossary-popover'
/** Set a frame after marking so the underline transitions in rather than popping. */
export const READY_ATTR = 'data-glossary-ready'

// The legacy widget's scan (afp-public-widgets ForecastView.vue, mark.js): only text inside a `p`
// or `li`, and never inside these — at any depth, where mark.js checked only the parent (ADR 018).
const CONTEXTS = 'p, li'
const NEVER_MARKED = [
  'a',
  'button',
  'figure',
  'figcaption',
  'table',
  'img',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  `[${TERM_ATTR}]`,
  `[${POPOVER_ATTR}]`,
].join(', ')
// The widget excluded these only below the `p`/`li` it was scanning, not above it: authored HTML
// often wraps whole paragraphs in a `div`.
const NOT_MARKED_WITHIN_CONTEXT = 'div, i'

// Layout-neutral by construction: decoration and color only, so wrapping a word never reflows it.
// Starts transparent and fades in once READY_ATTR is set.
export const TERM_CLASS = [
  'cursor-help rounded-sm underline decoration-dotted decoration-2 underline-offset-4',
  'decoration-transparent transition-[text-decoration-color] duration-500',
  'data-[glossary-ready]:decoration-muted-foreground hover:!decoration-foreground',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
  'print:no-underline',
].join(' ')

export type GlossaryMatcher = {
  pattern: RegExp
  /** Normalized match text → index into the entry list. */
  entryIndex: Map<string, number>
}

// Escapes regex metacharacters, then lets any run of whitespace stand for a space (as mark.js did),
// so a term broken across a line or an &nbsp; still matches.
const toPatternSource = (candidate: string) =>
  candidate
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+')

/**
 * One pattern for every term and alias. Case-insensitive and whole-word; alternatives are ordered
 * longest first so "Avalanche Path" wins over "Avalanche" at the same position. When two entries
 * claim the same text, the first in the list keeps it.
 */
export function buildGlossaryMatcher(entries: GlossaryEntry[]): GlossaryMatcher | null {
  const entryIndex = new Map<string, number>()
  entries.forEach((entry, index) => {
    for (const candidate of [entry.term, ...entry.aliases]) {
      const key = normalizeGlossaryText(candidate)
      if (key && !entryIndex.has(key)) entryIndex.set(key, index)
    }
  })
  if (entryIndex.size === 0) return null

  const alternatives = [...entryIndex.keys()]
    .sort((a, b) => b.length - a.length)
    .map(toPatternSource)
    .join('|')
  // Group 1 is the character before the term (a lookbehind would break Safari before 16.4); group 2
  // is the term. The lookahead keeps the term from ending mid-word, or mid-number: "D1" is not the
  // start of the half size "D1.5". A hyphen joins words, so "human-triggered" is one word and only
  // a term spelled with the hyphen matches it.
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}_\\-])(${alternatives})(?![\\p{L}\\p{N}_\\-]|\\.\\d)`,
    'giu',
  )
  return { pattern, entryIndex }
}

function isMarkable(text: Text, root: Element): boolean {
  let insideContext = false
  for (let el = text.parentElement; el && el !== root; el = el.parentElement) {
    if (el.matches(NEVER_MARKED)) return false
    if (insideContext) continue
    if (el.matches(CONTEXTS)) insideContext = true
    else if (el.matches(NOT_MARKED_WITHIN_CONTEXT)) return false
  }
  return insideContext
}

function createTerm(text: string, index: number): HTMLSpanElement {
  const span = document.createElement('span')
  span.textContent = text
  span.className = TERM_CLASS
  span.setAttribute(TERM_ATTR, String(index))
  // A span rather than a <button>: a button lays out as inline-block, so a two-word term could no
  // longer wrap across lines and marking would reflow the prose.
  span.setAttribute('role', 'button')
  span.setAttribute('tabindex', '0')
  span.setAttribute('aria-haspopup', 'dialog')
  span.setAttribute('aria-expanded', 'false')
  // iOS Safari delivers a tap's click to a document listener only when the tapped element is
  // clickable itself; the listener lives in termEvents.ts.
  span.onclick = () => {}
  return span
}

function markTextNode(node: Text, matcher: GlossaryMatcher): HTMLSpanElement[] {
  const source = node.data
  const fragment = document.createDocumentFragment()
  const created: HTMLSpanElement[] = []
  let cursor = 0

  for (const match of source.matchAll(matcher.pattern)) {
    const [, before, term] = match
    const index = matcher.entryIndex.get(normalizeGlossaryText(term))
    if (index === undefined || match.index === undefined) continue
    const start = match.index + before.length
    fragment.append(source.slice(cursor, start))
    const span = createTerm(term, index)
    fragment.append(span)
    created.push(span)
    cursor = start + term.length
  }

  if (created.length === 0) return created
  fragment.append(source.slice(cursor))
  node.replaceWith(fragment)
  return created
}

/**
 * Wraps every glossary term in `root`'s prose in a focusable control. Safe to run again over the
 * same root: text already inside a term is skipped. Returns the controls it created.
 */
export function markGlossaryTerms(root: Element, matcher: GlossaryMatcher): HTMLSpanElement[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  // Collected first: replacing a node mid-walk would derail the walker.
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node instanceof Text && isMarkable(node, root)) textNodes.push(node)
  }
  return textNodes.flatMap((node) => markTextNode(node, matcher))
}
