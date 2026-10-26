import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { GLOSSARY_CACHE_TAG, type GlossaryEntry } from './glossaryEntry'

async function readGlossaryTerms(): Promise<GlossaryEntry[]> {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'glossaryTerms',
    pagination: false,
    limit: 0,
    depth: 0,
    sort: 'term',
    select: { term: true, aliases: true, definition: true, link: true },
  })
  // An empty read is far likelier a database mid-restore than an editor deleting every term, and
  // a cached miss would hold until the next term edit. See docs/revalidation.md.
  if (docs.length === 0) throw new Error('No glossary terms found. Refusing to cache the miss.')

  return docs.map((doc) => ({
    term: doc.term,
    aliases: doc.aliases ?? [],
    definition: doc.definition,
    link: doc.link || null,
  }))
}

/** The national term list, cached until a Glossary Term changes. */
export const getCachedGlossaryTerms = unstable_cache(readGlossaryTerms, ['glossary-terms'], {
  tags: [GLOSSARY_CACHE_TAG],
})
