import configPromise from '@payload-config'
import { getPayload } from 'payload'

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
      // The tag purge clears the data cache but not a CDN copy, so this bounds how long an edit
      // can take to reach readers: about two minutes.
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=60' },
    })
  } catch (err) {
    // The glossary is an enhancement; the page renders plain prose without it.
    await logGlossaryFailure(err)
    return NextResponse.json({ error: 'Glossary unavailable' }, { status: 503, headers: NO_STORE })
  }
}

async function logGlossaryFailure(err: unknown) {
  try {
    const payload = await getPayload({ config: configPromise })
    payload.logger.error({ err }, 'Glossary terms could not be read')
  } catch {
    // Payload itself failed to start; the 503 is all there is to say.
  }
}
