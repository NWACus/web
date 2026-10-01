/** NWAC's native Mountain Weather page: a date's issuances (today's by default), region-wide. */
import { ForecastDisclaimer } from '@/components/forecast/ForecastDisclaimer'
import { ForecastErrorBoundary } from '@/components/forecast/ForecastErrorBoundary'
import { ForecastHeader } from '@/components/forecast/ForecastHeader'
import { Card, CardContent } from '@/components/ui/card'
import { todayInTimezone } from '@/services/nac/forecastArchive'
import { getActiveForecastZones, getAvalancheCenterMetadata } from '@/services/nac/nac'
import {
  fmtCalendarDate,
  issuanceLabel,
  issuanceShortLabel,
} from '@/services/nac/nwacWeatherFormat'
import { getNWACWeatherSource } from '@/services/nac/sources'
import { formatDateTime } from '@/utilities/formatDateTime'

import { DatePicker } from './DatePicker.client'
import { IssuanceSwitch } from './IssuanceSwitch.client'
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

function issueTime(iso: string, timezone: string | null | undefined): string | null {
  return isNaN(new Date(iso).getTime()) ? null : formatDateTime(iso, timezone, 'h:mm a')
}

export async function ForecastPage({ centerSlug, date }: { centerSlug: string; date?: string }) {
  const metadata = await getAvalancheCenterMetadata(centerSlug)
  const today = todayInTimezone(metadata.timezone)
  const shown = date ?? today
  const yearAgo = `${Number(today.slice(0, 4)) - 1}${today.slice(4)}`
  // Either read throws on an upstream failure, so ISR keeps the last good page instead of caching
  // "nothing published".
  const source = getNWACWeatherSource()
  const [day, dates] = await Promise.all([source.getDay(shown), source.getDates(yearAgo, today)])
  const picker = <DatePicker date={shown} dates={dates} today={today} />

  if (!day) {
    return (
      <div className="container space-y-8 py-6">
        {picker}
        {HEADING}
        <p className="text-center text-muted-foreground">
          No Mountain Weather forecast published for {fmtCalendarDate(shown)}.
        </p>
        <ForecastDisclaimer centerType={metadata.type} centerName={metadata.name} />
      </div>
    )
  }

  const zonePaths = await zonePathsOf(centerSlug)
  return (
    <div className="container space-y-6 py-6">
      {picker}
      <IssuanceSwitch
        heading={HEADING}
        panels={day.issuances.map((issuance) => ({
          key: String(issuance.id),
          label: issuanceShortLabel(issuance.type),
          time: issueTime(issuance.issuedAt, metadata.timezone),
          anchor: issuance.type,
          meta: (
            <ForecastErrorBoundary fallbackMessage="Unable to display weather metadata">
              <ForecastHeader
                forecast={{
                  published_time: issuance.issuedAt,
                  expires_time: null,
                  author: issuance.author,
                }}
                timezone={metadata.timezone}
              />
            </ForecastErrorBoundary>
          ),
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
