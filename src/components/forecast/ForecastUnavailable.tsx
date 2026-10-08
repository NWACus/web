/**
 * What the live zone page shows in place of a forecast. With nothing displayable it is the legacy
 * widget's not-found state (NotFound.vue): an alert icon, "The requested product doesn't exist" and
 * the way on. A failed read keeps its own outage wording, so an outage never reads as "there is no
 * forecast", but offers the same two links.
 */
import { ARCHIVE_PATH } from '@/services/nac/forecastArchive'
import { TriangleAlert } from 'lucide-react'
import Link from 'next/link'

/** The all-zones page, which the widget's not-found state calls the Current Forecast. */
const ALL_ZONES_PATH = '/forecasts/avalanche'

const LINK_CLASS = 'font-medium underline underline-offset-2 hover:no-underline'

interface ForecastUnavailableProps {
  /** `none`: nothing displayable is published for the zone. `failed`: the read itself failed. */
  reason: 'none' | 'failed'
}

export function ForecastUnavailable({ reason }: ForecastUnavailableProps) {
  return (
    <div
      className="container flex flex-col items-center gap-3 py-12 text-center"
      data-testid={`forecast-unavailable-${reason}`}
    >
      <TriangleAlert className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
      {reason === 'none' ? (
        <h1 className="text-2xl font-semibold">The requested product doesn&apos;t exist</h1>
      ) : (
        <p className="text-lg font-medium">Unable to load forecast data. Please try again later.</p>
      )}
      <p className="text-muted-foreground">
        View the{' '}
        <Link href={ALL_ZONES_PATH} className={LINK_CLASS}>
          Current Forecast
        </Link>{' '}
        or view the{' '}
        <Link href={ARCHIVE_PATH} className={LINK_CLASS}>
          Forecast Archive
        </Link>
        .
      </p>
    </div>
  )
}
