/**
 * The native Mountain Weather page for a center on NWAC's in-house weather: the latest forecast date's
 * issuances, one at a time (newest first, with a switch to the other), in the region-wide view.
 * A zone's own weather sits on its avalanche forecast page (see NativeForecastPage), and the
 * region-wide view links there.
 */
import { Card, CardContent } from '@/components/ui/card'
import { getAvalancheCenterMetadata } from '@/services/nac/nac'
import { issuanceLabel, issuanceShortLabel } from '@/services/nac/nwacWeatherFormat'
import { getNwacWeatherSource } from '@/services/nac/sources'
import { zoneSlugFromUrl } from '@/services/nac/zoneSlug'

import { IssuanceSwitch } from './IssuanceSwitch.client'
import { IssuedLine, formatIssued } from './Issued'
import { Overall, type ZonePaths } from './Overall'

/** Each active zone's forecast page, opened at its Mountain Weather section. */
function zonePathsOf(metadata: Awaited<ReturnType<typeof getAvalancheCenterMetadata>>) {
  const paths: ZonePaths = {}
  for (const zone of metadata.zones) {
    if (zone.status !== 'active') continue
    const slug = zoneSlugFromUrl(zone.url)
    if (slug) paths[zone.id] = `/forecasts/avalanche/${slug}#mountain-weather`
  }
  return paths
}

export async function ForecastPage({ centerSlug }: { centerSlug: string }) {
  const [day, metadata] = await Promise.all([
    getNwacWeatherSource().getForecastDay(),
    getAvalancheCenterMetadata(centerSlug),
  ])

  if (!day) {
    return (
      <div className="container py-8 text-center text-muted-foreground">
        No published mountain weather forecast.
      </div>
    )
  }

  const zonePaths = zonePathsOf(metadata)
  return (
    <div className="container pb-6">
      <Card>
        <CardContent className="pt-6">
          <IssuanceSwitch
            panels={day.issuances.map((issuance) => ({
              key: String(issuance.id),
              label: issuanceShortLabel(issuance.type),
              time: formatIssued(issuance.issuedAt, metadata.timezone, 'h:mm a'),
              content: (
                <section aria-label={issuanceLabel(issuance.type)} className="space-y-4">
                  <IssuedLine issuance={issuance} timezone={metadata.timezone} />
                  <Overall issuance={issuance} zonePaths={zonePaths} />
                </section>
              ),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  )
}
