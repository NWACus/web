/**
 * Native center-level warnings surface for the home page: fetches the center's active
 * warning/watch/special bulletins across all its zones and renders the banner, plus the
 * revalidate-on-view freshness check that keeps a statically generated home page honest.
 */
import { RevalidateOnView } from '@/components/freshness/RevalidateOnView.client'
import { centerWarningsFingerprint, getCenterWarnings } from '@/services/nac/centerWarnings'

import { CenterWarningsBanner } from './CenterWarningsBanner'

interface CenterWarningsProps {
  centerSlug: string
}

export async function CenterWarnings({ centerSlug }: CenterWarningsProps) {
  const groups = await getCenterWarnings(centerSlug)

  return (
    <>
      <CenterWarningsBanner groups={groups} />
      {/* The home page is statically generated on a long revalidate window, so an alert issued or
          lifted after it rendered would otherwise sit unseen. This catches that on view. It runs
          even when no alert is active — that's precisely the case where one may have just been
          issued. */}
      <RevalidateOnView
        endpoints={[`/api/${centerSlug}/warning-freshness/${centerWarningsFingerprint(groups)}`]}
      />
    </>
  )
}
