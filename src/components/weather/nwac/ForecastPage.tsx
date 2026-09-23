/**
 * The native Mountain Weather page for a center on NWAC's in-house weather: the latest forecast date's
 * issuances, one at a time (newest first, with a switch to the other), in the region-wide view.
 * A zone's own weather sits on its avalanche forecast page (see NativeForecastPage), and the
 * region-wide view links there.
 */
import { ForecastDisclaimer } from '@/components/forecast/ForecastDisclaimer'
import { Card, CardContent } from '@/components/ui/card'
import { getAvalancheCenterMetadata } from '@/services/nac/nac'
import { issuanceLabel, issuanceShortLabel } from '@/services/nac/nwacWeatherFormat'
import { getNwacWeatherSource } from '@/services/nac/sources'
import { zoneSlugFromUrl } from '@/services/nac/zoneSlug'

import { IssuanceSwitch } from './IssuanceSwitch.client'
import { IssuedMeta, formatIssued } from './Issued'
import { Overall, OverallSectionTabs, type ZonePaths } from './Overall'

const HEADING = <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Mountain Weather</h1>

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
      <div className="container space-y-8 py-6">
        {HEADING}
        <p className="text-center text-muted-foreground">No published mountain weather forecast.</p>
        <ForecastDisclaimer centerType={metadata.type} centerName={metadata.name} />
      </div>
    )
  }

  const zonePaths = zonePathsOf(metadata)
  return (
    <div className="container py-6">
      <IssuanceSwitch
        heading={HEADING}
        panels={day.issuances.map((issuance) => ({
          key: String(issuance.id),
          label: issuanceShortLabel(issuance.type),
          time: formatIssued(issuance.issuedAt, metadata.timezone, 'h:mm a'),
          anchor: issuance.type,
          meta: <IssuedMeta issuance={issuance} timezone={metadata.timezone} />,
          content: (
            <Card>
              <section aria-label={issuanceLabel(issuance.type)}>
                <OverallSectionTabs issuance={issuance} />
                <CardContent className="pt-6">
                  <Overall issuance={issuance} zonePaths={zonePaths} />
                </CardContent>
              </section>
            </Card>
          ),
        }))}
      />
      <ForecastDisclaimer centerType={metadata.type} centerName={metadata.name} />
    </div>
  )
}
