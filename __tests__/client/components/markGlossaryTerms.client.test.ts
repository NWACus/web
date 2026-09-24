import {
  buildGlossaryMatcher,
  markGlossaryTerms,
  TERM_ATTR,
  type GlossaryMatcher,
} from '@/components/glossary/markGlossaryTerms'
import type { GlossaryEntry } from '@/services/glossary/glossaryEntry'

const entry = (term: string, aliases: string[] = []): GlossaryEntry => ({
  term,
  aliases,
  definition: `${term} definition`,
  link: null,
})

const ENTRIES = [
  entry('Avalanche', ['avalanches', 'slide']),
  entry('Avalanche Path', ['Avalanche Paths']),
  entry('Wind Slab', ['wind slabs']),
  entry('Slab'),
  entry('% snow'),
]

function matcher(entries = ENTRIES): GlossaryMatcher {
  const built = buildGlossaryMatcher(entries)
  if (!built) throw new Error('expected a matcher')
  return built
}

function render(html: string): HTMLDivElement {
  const root = document.createElement('div')
  root.innerHTML = html
  return root
}

/** Marked terms in document order, as `text→entry index`. */
function marks(root: Element): string[] {
  return [...root.querySelectorAll(`[${TERM_ATTR}]`)].map(
    (el) => `${el.textContent}→${el.getAttribute(TERM_ATTR)}`,
  )
}

describe('buildGlossaryMatcher', () => {
  it('returns null for an empty term list, so nothing mounts a matcher that matches nothing', () => {
    expect(buildGlossaryMatcher([])).toBeNull()
  })

  it('lets the first entry keep text two entries both claim', () => {
    const root = render('<p>A slab.</p>')
    markGlossaryTerms(root, matcher([entry('Slab'), entry('Other', ['slab'])]))
    expect(marks(root)).toEqual(['slab→0'])
  })
})

describe('markGlossaryTerms', () => {
  it('matches case-insensitively, as whole words, every occurrence', () => {
    const root = render('<p>AVALANCHE, then an avalanche. Avalanches and a slide; slideshow.</p>')
    markGlossaryTerms(root, matcher())
    expect(marks(root)).toEqual(['AVALANCHE→0', 'avalanche→0', 'Avalanches→0', 'slide→0'])
  })

  it('takes the longest term at a position', () => {
    const root = render('<p>The Avalanche Path ran. A wind slab sat on a slab.</p>')
    markGlossaryTerms(root, matcher())
    expect(marks(root)).toEqual(['Avalanche Path→1', 'wind slab→2', 'slab→3'])
  })

  it('matches a multi-word term across any run of whitespace, including a non-breaking space', () => {
    const root = render('<p>wind\n  slab and wind&nbsp;slabs</p>')
    markGlossaryTerms(root, matcher())
    expect(marks(root)).toEqual(['wind\n  slab→2', 'wind\u00a0slabs→2'])
  })

  it('does not match inside a longer word or a number', () => {
    const root = render('<p>Slabby snow, 30% snow, and 30 % snow.</p>')
    markGlossaryTerms(root, matcher())
    expect(marks(root)).toEqual(['% snow→4'])
  })

  it('leaves the surrounding text intact', () => {
    const root = render('<p>Watch for a <strong>slab</strong> on the avalanche path today.</p>')
    const before = root.textContent
    markGlossaryTerms(root, matcher())
    expect(root.textContent).toBe(before)
    expect(marks(root)).toEqual(['slab→3', 'avalanche path→1'])
  })

  it('marks only text inside a p or li', () => {
    const root = render(
      'slab at the root<ul><li>slab in a list</li></ul><p>slab in a paragraph</p>',
    )
    markGlossaryTerms(root, matcher())
    expect(marks(root)).toEqual(['slab→3', 'slab→3'])
  })

  it('marks a paragraph wrapped in a div, as the widget did', () => {
    const root = render('<div><p>slab</p></div>')
    markGlossaryTerms(root, matcher())
    expect(marks(root)).toEqual(['slab→3'])
  })

  it.each([
    ['a link', '<p><a href="#">slab</a></p>'],
    ['formatting inside a link', '<p><a href="#"><strong>slab</strong></a></p>'],
    ['a heading', '<h2>slab</h2>'],
    ['a table cell', '<table><tbody><tr><td><p>slab</p></td></tr></tbody></table>'],
    ['a figure caption', '<figure><img alt=""><figcaption><p>slab</p></figcaption></figure>'],
    ['a div below the list item', '<ul><li><div>slab</div></li></ul>'],
    ['an i below the paragraph', '<p><i>slab</i></p>'],
    ['a button', '<p><button>slab</button></p>'],
  ])('never marks inside %s', (_, html) => {
    const root = render(html)
    markGlossaryTerms(root, matcher())
    expect(marks(root)).toEqual([])
  })

  it('is safe to run again over marked prose', () => {
    const root = render('<p>slab and avalanche</p>')
    markGlossaryTerms(root, matcher())
    const html = root.innerHTML
    expect(markGlossaryTerms(root, matcher())).toEqual([])
    expect(root.innerHTML).toBe(html)
  })

  it('makes each term a focusable, collapsed popover control', () => {
    const root = render('<p>slab</p>')
    const [term] = markGlossaryTerms(root, matcher())
    expect(term.tagName).toBe('SPAN')
    expect(term.getAttribute('role')).toBe('button')
    expect(term.getAttribute('tabindex')).toBe('0')
    expect(term.getAttribute('aria-haspopup')).toBe('dialog')
    expect(term.getAttribute('aria-expanded')).toBe('false')
  })
})
