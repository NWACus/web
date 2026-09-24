import { getCachedGlossaryTerms } from '@/services/glossary/glossaryCache'
import { NO_STORE } from '@/utilities/apiResponses'
import { NextResponse } from 'next/server'

// Dynamic so a database hiccup answers 503 instead of freezing an error into a static response or
// failing the build. The read itself is cached and tagged, so this costs no query per request.
export const dynamic = 'force-dynamic'

/**
 * The national glossary term list, the only path by which terms reach a forecast page. Fetched by
 * the page's client island rather than passed as a prop, so a term edit purges this response and
 * never a forecast page (ADR 018).
 */
export async function GET() {
  try {
    const terms = await getCachedGlossaryTerms()
    return NextResponse.json(terms, {
      // Short at the edge: the tag purge clears the data cache, and this bounds how long a CDN copy
      // can lag behind an edit.
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch {
    // The glossary is an enhancement; the page renders plain prose without it.
    return NextResponse.json({ error: 'Glossary unavailable' }, { status: 503, headers: NO_STORE })
  }
}
