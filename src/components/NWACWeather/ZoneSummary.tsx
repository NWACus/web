/**
 * NWAC's Mountain Weather in the legacy forecast widget, latest issuance only: the zone's sensible
 * weather and table under the Avalanche Forecast tab, and the region-wide Overall view in the
 * Weather Forecast tab. Rendered in the browser (it goes into the widget, see WidgetZoneWeather).
 */
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { ForecastHeader } from '@/components/forecast/ForecastHeader'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import type { NWACWeatherForecastDay, NWACWeatherIssuance } from '@/services/nac/model/nwacWeather'
import { issuanceShortLabel, zonesFor } from '@/services/nac/nwacWeatherFormat'

import { issueTime } from './Issued'
import { Overall, overallParts } from './Overall'
import { ZoneTable } from './ZoneTable'

/** The Mountain Weather page's heading row and metadata, the issuance as its switch's pick. */
function IssuanceHeader({
  issuance,
  timezone,
}: {
  issuance: NWACWeatherIssuance
  timezone: string | null | undefined
}) {
  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <CardTitle>Mountain Weather</CardTitle>
        <span className="inline-flex rounded-md bg-muted p-1">
          <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-sm bg-background px-3 py-1 text-sm font-semibold shadow-sm">
            {issuanceShortLabel(issuance.type)}
            <span className="font-normal text-muted-foreground">
              {issueTime(issuance.issuedAt, timezone)}
            </span>
          </span>
        </span>
      </header>
      <ForecastHeader
        forecast={{
          published_time: issuance.issuedAt,
          expires_time: null,
          author: issuance.author,
        }}
        timezone={timezone}
      />
    </>
  )
}

function WeatherCard({
  issuance,
  timezone,
  children,
}: {
  issuance: NWACWeatherIssuance
  timezone: string | null | undefined
  children: ReactNode
}) {
  return (
    <Card
      id="mountain-weather"
      className="scroll-mt-24 rounded-none border-0 bg-transparent pb-8 shadow-none"
    >
      <CardContent className="space-y-6 p-0">
        <IssuanceHeader issuance={issuance} timezone={timezone} />
        {children}
        <div className="flex justify-end print:hidden">
          <Link
            href="/weather/forecast"
            className="inline-flex items-center gap-1 font-medium text-secondary underline"
          >
            Full Mountain Weather Forecast
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

interface SummaryProps {
  day: NWACWeatherForecastDay
  avalancheZoneId: number
  timezone: string | null | undefined
}

/** The day's issuances come newest first; the first covering the zone. */
function latestFor(day: NWACWeatherForecastDay, avalancheZoneId: number) {
  return day.issuances.find((i) => zonesFor(i, avalancheZoneId).length > 0)
}

export function ZoneSummary({ day, avalancheZoneId, timezone }: SummaryProps) {
  const latest = latestFor(day, avalancheZoneId)
  if (!latest) return null
  const zones = zonesFor(latest, avalancheZoneId)
  return (
    <WeatherCard issuance={latest} timezone={timezone}>
      {zones.map((zone) => (
        <ZoneTable key={zone.id} issuance={latest} zone={zone} heading={zones.length > 1} />
      ))}
    </WeatherCard>
  )
}

/** The Weather Forecast tab: the same issuance as the Overall view, every zone. */
export function OverallSummary({ day, avalancheZoneId, timezone }: SummaryProps) {
  const latest = latestFor(day, avalancheZoneId)
  if (!latest) return null
  return (
    <WeatherCard issuance={latest} timezone={timezone}>
      <Overall parts={overallParts(latest)} />
    </WeatherCard>
  )
}
