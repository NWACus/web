/** NWAC's native Mountain Weather page: a date's issuances (today's by default), region-wide. */
import { ForecastDisclaimer } from '@/components/forecast/ForecastDisclaimer'
import { ForecastErrorBoundary } from '@/components/forecast/ForecastErrorBoundary'
import { ForecastHeader } from '@/components/forecast/ForecastHeader'
import { RevalidateOnView } from '@/components/freshness/RevalidateOnView.client'
import { Card, CardContent } from '@/components/ui/card'
import { initialArchiveWindow } from '@/services/nac/archiveDates'
import { todayInTimezone } from '@/services/nac/forecastArchive'
import { nwacWeatherFreshnessEndpoint } from '@/services/nac/forecastFingerprint'
import { getActiveForecastZones, getAvalancheCenterMetadata } from '@/services/nac/nac'
import { currentNWACWeatherDay } from '@/services/nac/nwacWeatherCurrent'
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

/**
 * The forecast a page shows and the date it is for. A dated page shows its own date; today's page
 * shows the current forecast, which until the morning issuance is yesterday afternoon's.
 */
async function readShown(date: string | undefined, today: string) {
  const source = getNWACWeatherSource()
  if (date) return { day: await source.getDay(date, { historical: date < today }), shown: date }
  const day = currentNWACWeatherDay(await source.getLatest(), today)
  return { day, shown: day?.serviceDate ?? today }
}

export async function ForecastPage({ centerSlug, date }: { centerSlug: string; date?: string }) {
  const metadata = await getAvalancheCenterMetadata(centerSlug)
  const today = todayInTimezone(metadata.timezone)
  // The picker opens populated for the shown month and the one before; it loads older months itself.
  const window = initialArchiveWindow(date ?? today)
  // Either read throws on an upstream failure, so ISR keeps the last good page instead of caching
  // "nothing published".
  const [{ day, shown }, dates] = await Promise.all([
    readShown(date, today),
    getNWACWeatherSource().getDates(window.from, window.to, { historical: window.to < today }),
  ])
  const picker = (
    <DatePicker date={shown} today={today} initialDates={dates} initialRange={window} />
  )
  // Today's page only: it is the one a correction, a new issuance or a withdrawal can change.
  const freshness = date ? null : (
    <RevalidateOnView endpoints={[nwacWeatherFreshnessEndpoint(centerSlug, day)]} />
  )

  if (!day) {
    return (
      <div className="container space-y-8 py-6">
        {picker}
        {HEADING}
        <p className="text-center text-muted-foreground">
          No Mountain Weather forecast published for {fmtCalendarDate(shown)}.
        </p>
        <ForecastDisclaimer centerType={metadata.type} centerName={metadata.name} />
        {freshness}
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
      {freshness}
    </div>
  )
}
