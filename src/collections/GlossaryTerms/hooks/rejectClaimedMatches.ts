import type { CollectionBeforeValidateHook } from 'payload'
import { ValidationError } from 'payload'

import type { GlossaryTerm } from '@/payload-types'
import { normalizeGlossaryText } from '@/services/glossary/glossaryEntry'

type Matches = { term?: string | null; aliases?: string[] | null }

/**
 * One error per term or alias that another Glossary Term already matches. Two terms claiming the
 * same text would silently show only the first one's definition, so the second is refused instead.
 */
export function claimedMatchErrors(
  doc: Matches,
  others: (Matches & { term: string })[],
): { path: string; message: string }[] {
  const owners = new Map<string, string>()
  for (const other of others) {
    for (const text of [other.term, ...(other.aliases ?? [])]) {
      owners.set(normalizeGlossaryText(text), other.term)
    }
  }

  const candidates = [
    { path: 'term', text: doc.term ?? '' },
    ...(doc.aliases ?? []).map((text) => ({ path: 'aliases', text })),
  ]
  return candidates.flatMap(({ path, text }) => {
    const owner = owners.get(normalizeGlossaryText(text))
    return owner ? [{ path, message: `"${text}" already shows the definition of "${owner}".` }] : []
  })
}

export const rejectClaimedMatches: CollectionBeforeValidateHook<GlossaryTerm> = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data) return data

  const { docs: others } = await req.payload.find({
    collection: 'glossaryTerms',
    // On create Payload passes an originalDoc with no id.
    where: originalDoc?.id ? { id: { not_equals: originalDoc.id } } : {},
    pagination: false,
    limit: 0,
    depth: 0,
    select: { term: true, aliases: true },
    req,
  })
  const errors = claimedMatchErrors(
    { term: data.term ?? originalDoc?.term, aliases: data.aliases ?? originalDoc?.aliases },
    others,
  )
  if (errors.length > 0) throw new ValidationError({ collection: 'glossaryTerms', errors }, req.t)

  return data
}
