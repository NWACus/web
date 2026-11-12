/** NWAC's native Mountain Weather page: a date's issuances (today's by default), region-wide. */
import { ForecastDisclaimer } from '@/components/forecast/ForecastDisclaimer'
import { ForecastErrorBoundary } from '@/components/forecast/ForecastErrorBoundary'
import { ForecastHeader } from '@/components/forecast/ForecastHeader'
import { RevalidateOnView } from '@/components/freshness/RevalidateOnView.client'
import { Card, CardContent } from '@/components/ui/card'
import { initialArchiveWindow } from '@/services/nac/archiveDates'
import { todayInTimezone } from '@/services/nac/forecastArchive'
import { nwacWeatherFreshnessEndpoint } from '@/services/nac/forecastFingerprint'
import type { NWACWeatherIssuance } from '@/services/nac/model/nwacWeather'
import { getActiveForecastZones, getAvalancheCenterMetadata } from '@/services/nac/nac'
import { currentNWACWeatherDay, isPastNWACWeatherDate } from '@/services/nac/nwacWeatherCurrent'
import {
  fmtCalendarDate,
  issuanceLabel,
  issuanceShortLabel,
  issueTime,
} from '@/services/nac/nwacWeatherFormat'
import { getNWACWeatherSource } from '@/services/nac/sources'
import { addMonths, endOfMonth, format, parseISO, subDays } from 'date-fns'
import { ArrowRight, History } from 'lucide-react'
import Link from 'next/link'

import { DatePicker } from './DatePicker.client'
import { IssuanceSwitch } from './IssuanceSwitch.client'
import { Overall, OverallSectionTabs, overallParts, type ZonePaths } from './Overall'
import { sanitizeIssuance } from './sanitizeIssuance'

const HEADING = <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Mountain Weather</h1>

/** Each active zone's avalanche forecast page: for `date` when one is picked, else the current. */
async function zonePathsOf(centerSlug: string, date: string | undefined) {
  const paths: ZonePaths = {}
  for (const { slug, zone } of await getActiveForecastZones(centerSlug)) {
    paths[zone.id] = date ? `/forecasts/avalanche/${slug}/${date}` : `/forecasts/avalanche/${slug}`
  }
  return paths
}

function pickerWindow(anchor: string, today: string) {
  const { from } = initialArchiveWindow(anchor)
  const nextMonthEnd = format(endOfMonth(addMonths(parseISO(anchor), 1)), 'yyyy-MM-dd')
  return { from, to: nextMonthEnd < today ? nextMonthEnd : today }
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

/**
 * Only yesterday turns on the latest forecast; any earlier date is past without it. Skipping the
 * read keeps older pages off its 300s cache, which would cut their 30-day window to five minutes.
 */
async function isPast(date: string | undefined, today: string) {
  if (!date || date >= today) return false
  if (date < format(subDays(parseISO(today), 1), 'yyyy-MM-dd')) return true
  return isPastNWACWeatherDate(date, await getNWACWeatherSource().getLatest(), today)
}

function PastForecastNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-amber-950 print:hidden"
    >
      <History aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <p>
        This is a past forecast.{' '}
        <Link
          href="/weather/forecast"
          className="inline-flex items-center gap-1 font-semibold underline"
        >
          See the latest Mountain Weather Forecast
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </p>
    </div>
  )
}

/** One issuance's tables, built once for both the section tabs and the body. */
function IssuanceCard({
  issuance,
  zonePaths,
  timezone,
}: {
  issuance: NWACWeatherIssuance
  zonePaths: ZonePaths
  timezone: string
}) {
  const parts = overallParts(sanitizeIssuance(issuance), timezone)
  return (
    // No card on a phone: its padding would take the width the tables need.
    <Card className="max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none">
      <section aria-label={issuanceLabel(issuance.type)}>
        <OverallSectionTabs parts={parts} />
        <CardContent className="pt-6 max-md:px-0">
          <Overall parts={parts} zonePaths={zonePaths} />
        </CardContent>
      </section>
    </Card>
  )
}

export async function ForecastPage({ centerSlug, date }: { centerSlug: string; date?: string }) {
  const metadata = await getAvalancheCenterMetadata(centerSlug)
  const today = todayInTimezone(metadata.timezone)
  // The picker opens populated for the shown month, the one before and the one after (so the
  // Newer arrow has a target from a month's last date); it loads other months itself.
  const window = pickerWindow(date ?? today, today)
  // Either read throws on an upstream failure, so ISR keeps the last good page instead of caching
  // "nothing published".
  const [{ day, shown }, dates, zonePaths, past] = await Promise.all([
    readShown(date, today),
    getNWACWeatherSource().getDates(window.from, window.to, { historical: window.to < today }),
    zonePathsOf(centerSlug, date),
    isPast(date, today),
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

  return (
    <div className="container space-y-6 py-6">
      {picker}
      {past && <PastForecastNotice />}
      {/* Keyed on the issuances, so a refresh that adds or withdraws one shows the newest. */}
      <IssuanceSwitch
        key={day.issuances.map((i) => i.id).join('-')}
        heading={HEADING}
        latest={!past}
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
            <IssuanceCard issuance={issuance} zonePaths={zonePaths} timezone={metadata.timezone} />
          ),
        }))}
      />
      <ForecastDisclaimer centerType={metadata.type} centerName={metadata.name} />
      {freshness}
    </div>
  )
}
