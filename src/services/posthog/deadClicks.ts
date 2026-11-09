import { z } from 'zod'

export const deadClickRowSchema = z.object({
  path: z.string(),
  tag: z.string().nullable(),
  alt: z.string().nullable(),
  aria_label: z.string().nullable(),
  el_text: z.string().nullable(),
  href: z.string().nullable(),
  clicks: z.coerce.number(),
  people: z.coerce.number(),
})

export type DeadClickQueryRow = z.infer<typeof deadClickRowSchema>

export type DeadClickTarget = {
  path: string
  label: string
  clicks: number
  people: number
}

const TAG_WORDS: Record<string, string> = {
  a: 'Link',
  button: 'Button',
  canvas: 'Canvas',
  div: 'Page area',
  h1: 'Heading',
  h2: 'Heading',
  h3: 'Heading',
  h4: 'Heading',
  h5: 'Heading',
  h6: 'Heading',
  iframe: 'Embedded frame',
  img: 'Image',
  input: 'Input',
  label: 'Label',
  li: 'List item',
  p: 'Paragraph',
  path: 'Icon',
  section: 'Page section',
  span: 'Text',
  svg: 'Icon',
  td: 'Table cell',
  th: 'Table header',
  tr: 'Table row',
  video: 'Video',
}

const MAX_LABEL_TEXT = 80

function clip(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim() // collapse newlines and runs of spaces
  return compact.length > MAX_LABEL_TEXT ? `${compact.slice(0, MAX_LABEL_TEXT - 1)}…` : compact
}

function firstText(...candidates: Array<string | null>): string | null {
  for (const candidate of candidates) {
    const text = candidate?.trim()
    if (text) return text
  }
  return null
}

/** Plain-words label for a dead-click target: what it is, then what it said. */
export function labelDeadClick(
  row: Pick<DeadClickQueryRow, 'tag' | 'alt' | 'aria_label' | 'el_text' | 'href'>,
): string {
  const tag = row.tag?.toLowerCase() ?? ''
  const word = TAG_WORDS[tag] ?? (tag ? `<${tag}>` : 'Element')
  const text = firstText(row.alt, row.el_text, row.aria_label)
  if (text) return `${word} “${clip(text)}”`
  if (row.href?.trim()) return `${word} to ${clip(row.href)}`
  return word
}

/**
 * Collapses query groups that share a page and label. Clicks add up; people is kept as the largest
 * group's count, since the same person may appear in several groups.
 */
export function mergeDeadClicks(rows: DeadClickQueryRow[], limit = 10): DeadClickTarget[] {
  const merged = new Map<string, DeadClickTarget>()
  for (const row of rows) {
    const label = labelDeadClick(row)
    const key = `${row.path}\u0000${label}`
    const existing = merged.get(key)
    if (existing) {
      existing.clicks += row.clicks
      existing.people = Math.max(existing.people, row.people)
    } else {
      merged.set(key, { path: row.path, label, clicks: row.clicks, people: row.people })
    }
  }
  return Array.from(merged.values())
    .sort((a, b) => b.people - a.people || b.clicks - a.clicks)
    .slice(0, limit)
}
