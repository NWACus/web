/** NWAC's native Mountain Weather page: today's issuances in the region-wide view. */
import { ForecastDisclaimer } from '@/components/forecast/ForecastDisclaimer'
import { Card, CardContent } from '@/components/ui/card'
import {
  fetchNwacWeatherForecasts,
  getActiveForecastZones,
  getAvalancheCenterMetadata,
} from '@/services/nac/nac'
import {
  fmtCalendarDate,
  issuanceLabel,
  issuanceShortLabel,
} from '@/services/nac/nwacWeatherFormat'
import { mapV3NwacWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns/format'

import { IssuanceSwitch } from './IssuanceSwitch.client'
import { IssuedMeta, formatIssued } from './Issued'
import { Overall, OverallSectionTabs, type ZonePaths } from './Overall'

const HEADING = <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Mountain Weather</h1>

/** Each active zone's avalanche forecast page. */
async function zonePathsOf(centerSlug: string) {
  const paths: ZonePaths = {}
  for (const { slug, zone } of await getActiveForecastZones(centerSlug)) {
    paths[zone.id] = `/forecasts/avalanche/${slug}`
  }
  return paths
}

/** Today's calendar date in the center's timezone as `yyyy-MM-dd`. */
function todayInTimezone(timezone: string | null | undefined) {
  const now = new Date()
  return format(timezone ? new TZDate(now.getTime(), timezone) : now, 'yyyy-MM-dd')
}

export async function ForecastPage({ centerSlug }: { centerSlug: string }) {
  const metadata = await getAvalancheCenterMetadata(centerSlug)
  const today = todayInTimezone(metadata.timezone)
  const wire = await fetchNwacWeatherForecasts({ date: today })
  const day = wire && mapV3NwacWeatherForecastDay(wire)

  if (!day) {
    return (
      <div className="container space-y-8 py-6">
        {HEADING}
        <p className="text-center text-muted-foreground">
          No Mountain Weather forecast published for {fmtCalendarDate(today)}.
        </p>
        <ForecastDisclaimer centerType={metadata.type} centerName={metadata.name} />
      </div>
    )
  }

  const zonePaths = await zonePathsOf(centerSlug)
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
