import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { GlossaryTerm } from '@/payload-types'
import { GLOSSARY_CACHE_TAG } from '@/services/glossary/glossaryEntry'
import { revalidateTag } from 'next/cache'

// Purges only the /api/glossary response. Forecast pages never carry the terms, so no page is
// revalidated for a glossary edit (ADR 018).
export const revalidateGlossary: CollectionAfterChangeHook<GlossaryTerm> = ({
  req: { context },
}) => {
  if (context.disableRevalidate) return
  revalidateTag(GLOSSARY_CACHE_TAG)
}

export const revalidateGlossaryDelete: CollectionAfterDeleteHook<GlossaryTerm> = ({
  req: { context },
}) => {
  if (context.disableRevalidate) return
  revalidateTag(GLOSSARY_CACHE_TAG)
}
