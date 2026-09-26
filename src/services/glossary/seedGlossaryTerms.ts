import type { PayloadRequest } from 'payload'

import { LEGACY_GLOSSARY_TERMS } from './legacyGlossaryTerms'

// The glossary terms, run by the data migration in deployed environments and by `pnpm seed`
// locally (push mode never runs migrations). Kept out of the migration file so the migration stays
// disposable: branch migrations are deleted and recreated on a main merge (coding-guide.md).

export type GlossaryTermSeed = {
  term: string
  aliases: string[]
  definition: string
  link: string
}

// The slice of the local API the seed uses, so a test can hand in a plain object.
export type GlossarySeedPayload = {
  find(args: {
    collection: 'glossaryTerms'
    limit: number
    pagination: boolean
    depth: number
    select: { term: true }
    req?: PayloadRequest
  }): Promise<{ docs: { term: string }[] }>
  create(args: {
    collection: 'glossaryTerms'
    data: GlossaryTermSeed
    context: { disableRevalidate: boolean }
    req?: PayloadRequest
  }): Promise<unknown>
}

/**
 * Put the glossary terms in place, once: a term that already exists is left exactly as an editor
 * has it, so re-running never overwrites a correction made in the admin panel.
 *
 * Disables the revalidation hook -- there is no request to revalidate against in a migration or
 * the seed script.
 */
export async function seedGlossaryTerms(
  payload: GlossarySeedPayload,
  terms: GlossaryTermSeed[] = LEGACY_GLOSSARY_TERMS,
  req?: PayloadRequest,
): Promise<{ termsCreated: number }> {
  const { docs: existing } = await payload.find({
    collection: 'glossaryTerms',
    limit: 0,
    pagination: false,
    depth: 0,
    select: { term: true },
    req,
  })
  const present = new Set(existing.map((doc) => doc.term.toLowerCase()))

  let termsCreated = 0
  for (const term of terms) {
    if (present.has(term.term.toLowerCase())) continue
    await payload.create({
      collection: 'glossaryTerms',
      data: term,
      context: { disableRevalidate: true },
      req,
    })
    termsCreated++
  }
  return { termsCreated }
}
