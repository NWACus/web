/**
 * A record's own page — `/observations/<id>` and `/observations/avalanches/<id>` loaded directly,
 * or opened in a new tab from the list. Server-rendered from the same prepared detail the modal
 * over the list fetches, so the two can't drift.
 *
 * Rendered per request: an upstream failure must not be cached as the page. A record the API has
 * no public copy of (missing, draft or private all answer 204) is "not found", and a failure is
 * "couldn't load" — both said on the page, never an empty one.
 */
import { ButtonLink } from '@/components/ButtonLink'
import ObservationsDisclaimer from '@/components/ObservationsDisclaimer'
import type { ObservationKind } from '@/services/nac/model/observation'
import { isObservationId } from '@/services/nac/observations/routes'
import { centerTimezone } from '@/utilities/tenancy/avalancheCenters'

import { AvalancheDetail } from './detail/AvalancheDetail'
import { DetailMessage } from './detail/DetailModal'
import { RECORD_TITLES, type DetailData } from './detail/detailTypes'
import { loadDetail } from './detail/loadDetail'
import { ObservationDetail } from './detail/ObservationDetail'

type Loaded = { state: 'ready'; detail: DetailData } | { state: 'not-found' } | { state: 'error' }

async function load(center: string, kind: ObservationKind, id: string): Promise<Loaded> {
  if (!isObservationId(id)) return { state: 'not-found' }
  try {
    const detail = await loadDetail(center, kind, id)
    return detail ? { state: 'ready', detail } : { state: 'not-found' }
  } catch {
    return { state: 'error' }
  }
}

function Detail({
  loaded,
  kind,
  timezone,
}: {
  loaded: Loaded
  kind: ObservationKind
  timezone: string
}) {
  if (loaded.state !== 'ready') return <DetailMessage status={loaded.state} kind={kind} />
  if (loaded.detail.kind === 'observation') {
    return <ObservationDetail detail={loaded.detail} timezone={timezone} TitleTag={null} />
  }
  return <AvalancheDetail detail={loaded.detail} timezone={timezone} TitleTag={null} />
}

export async function NativeObservationDetailPage({
  center,
  kind,
  id,
}: {
  center: string
  kind: ObservationKind
  id: string
}) {
  const loaded = await load(center, kind, id)
  const timezone = centerTimezone(center)

  return (
    <div className="container flex flex-col gap-4 pb-8">
      {/* The Observations page's header: the title left, its actions right, the disclaimer below. */}
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
        <h1 className="text-3xl font-bold sm:text-4xl">{RECORD_TITLES[kind]}</h1>
        <div className="flex flex-row flex-wrap gap-2">
          <ButtonLink variant="secondary" href="/observations">
            Recent Observations
          </ButtonLink>
          <ButtonLink variant="secondary" href="/observations/submit">
            Submit Observation
          </ButtonLink>
        </div>
      </div>
      <ObservationsDisclaimer />
      <Detail loaded={loaded} kind={kind} timezone={timezone} />
    </div>
  )
}
