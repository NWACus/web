import { htmlToDescription } from '@/utilities/htmlToDescription'

// Bottom lines as the AFP API returns them (SNFAC products in the e2e golden corpus).
const SNFAC_REFER_ELSEWHERE =
  "<p><em>Refer to the Galena Summit &amp; Eastern Mtns forecast if you're traveling in the western half of this zone&mdash;including the Warm Springs Ck drainage&mdash;or in the mountains north or east of Ketchum.&nbsp;</em></p>"

const SNFAC_TWO_PARAGRAPHS =
  '<p class="nac-html-p">The threat of wet avalanches is highest early in the week. Avoid steep slopes where a wet, mushy snowpack does not support your sled or skis, and where you observe rollerballs or pinwheels moving downslope. Although much less likely, larger human-triggered slab avalanches remain possible on shadier aspects in alpine and upper elevation terrain.&nbsp;</p>\n<p class="nac-html-p"><em>We will update this product on or before Friday, April 10th.</em></p>'

describe('htmlToDescription', () => {
  it('strips tags and decodes entities in a bottom line that starts with <p>', () => {
    expect(htmlToDescription(SNFAC_REFER_ELSEWHERE)).toBe(
      "Refer to the Galena Summit & Eastern Mtns forecast if you're traveling in the western half of this zone—including the Warm Springs Ck drainage—or in the mountains north or east of Ketchum.",
    )
  })

  it('separates paragraphs and collapses whitespace, including &nbsp;', () => {
    expect(htmlToDescription('<p>Dangerous&nbsp;&nbsp;conditions.</p>\n\n<p>Stay home.</p>')).toBe(
      'Dangerous conditions. Stay home.',
    )
  })

  it('keeps inline elements flush with the text around them', () => {
    expect(
      htmlToDescription(
        '<p>Danger is <strong>High</strong>, so avoid <a href="/x">avalanche terrain</a>.</p>',
      ),
    ).toBe('Danger is High, so avoid avalanche terrain.')
  })

  it('separates lines joined by <br>', () => {
    expect(htmlToDescription('Line one<br>Line two<br/>Line three')).toBe(
      'Line one Line two Line three',
    )
  })

  it('keeps decoded angle brackets and ampersands as text, never as markup', () => {
    expect(
      htmlToDescription('<p>Slopes &lt;30&deg; &amp; &quot;safe&quot; &#8212; &amp;lt;</p>'),
    ).toBe('Slopes <30° & "safe" — &lt;')
  })

  it('drops script and style contents', () => {
    expect(
      htmlToDescription('<style>p{color:red}</style><p>Text</p><script>alert(1)</script>'),
    ).toBe('Text')
  })

  it('passes plain text through unchanged', () => {
    expect(htmlToDescription('Avoid steep, wind-loaded slopes.')).toBe(
      'Avoid steep, wind-loaded slopes.',
    )
  })

  it('returns undefined for empty, missing or tag-only input', () => {
    expect(htmlToDescription(null)).toBeUndefined()
    expect(htmlToDescription(undefined)).toBeUndefined()
    expect(htmlToDescription('')).toBeUndefined()
    expect(htmlToDescription('<p>&nbsp;</p>')).toBeUndefined()
  })

  it('cuts a long bottom line at a sentence end when one is in range', () => {
    const description = htmlToDescription(SNFAC_TWO_PARAGRAPHS)

    expect(description).toBe(
      'The threat of wet avalanches is highest early in the week. Avoid steep slopes where a wet, mushy snowpack does not support your sled or skis, and where you observe rollerballs or pinwheels moving downslope.',
    )
  })

  it('falls back to a word boundary with an ellipsis when no sentence end is in range', () => {
    const description = htmlToDescription(
      '<p>Avoid steep slopes where a wet, mushy snowpack does not support your sled</p>',
      40,
    )

    expect(description).toBe('Avoid steep slopes where a wet, mushy…')
    expect(description?.length ?? 0).toBeLessThanOrEqual(40)
  })

  it('does not end on a dangling comma or dash before the ellipsis', () => {
    expect(htmlToDescription('Wind slabs, cornices — and more besides here', 25)).toBe(
      'Wind slabs, cornices…',
    )
  })

  it('ignores a sentence end too early to keep half the budget', () => {
    expect(htmlToDescription('Hi. Then a much longer second sentence that runs on', 30)).toBe(
      'Hi. Then a much longer second…',
    )
  })
})
