/**
 * NWAC's Mountain Weather beside a forecast, one issuance only: the zone's sensible weather and
 * table under the forecast, and in the widget the region-wide Overall view in the Weather Forecast
 * tab. The widget page renders it in the browser (see WidgetZoneWeather); the native forecast
 * panel renders the zone's as one of its sections.
 */
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { ForecastHeader } from '@/components/forecast/ForecastHeader'
import { sectionHeading } from '@/components/forecast/forecastHeadings'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import type { NWACWeatherForecastDay, NWACWeatherIssuance } from '@/services/nac/model/nwacWeather'
import { issuanceLabel, zonesFor } from '@/services/nac/nwacWeatherFormat'

import { Overall, overallParts } from './Overall'
import { ZoneTable } from './ZoneTable'

/** The heading, naming the one issuance shown, and the Mountain Weather page's metadata row. */
function IssuanceHeader({
  issuance,
  timezone,
  inPanel,
}: {
  issuance: NWACWeatherIssuance
  timezone: string | null | undefined
  inPanel: boolean
}) {
  const title = (
    <>
      Mountain Weather
      <span className="font-normal text-muted-foreground"> · {issuanceLabel(issuance.type)}</span>
    </>
  )
  return (
    <>
      {inPanel ? <h2 className={sectionHeading}>{title}</h2> : <CardTitle>{title}</CardTitle>}
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
  inPanel = false,
  children,
}: {
  issuance: NWACWeatherIssuance
  timezone: string | null | undefined
  inPanel?: boolean
  children: ReactNode
}) {
  const content = (
    <>
      <IssuanceHeader issuance={issuance} timezone={timezone} inPanel={inPanel} />
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
    </>
  )

  // The panel's own sections are headed sections, ruled off by the panel, not cards.
  if (inPanel) return <section className="space-y-4">{content}</section>

  return (
    <Card
      id="mountain-weather"
      className="scroll-mt-24 rounded-none border-0 bg-transparent pb-8 shadow-none"
    >
      <CardContent className="space-y-6 p-0">{content}</CardContent>
    </Card>
  )
}

interface SummaryProps {
  day: NWACWeatherForecastDay
  avalancheZoneId: number
  timezone: string | null | undefined
  /** As a section of the native forecast panel rather than the widget's card. */
  inPanel?: boolean
}

/** The day's issuances come newest first; the first covering the zone. */
function latestFor(day: NWACWeatherForecastDay, avalancheZoneId: number) {
  return day.issuances.find((i) => zonesFor(i, avalancheZoneId).length > 0)
}

export function ZoneSummary({ day, avalancheZoneId, timezone, inPanel }: SummaryProps) {
  const latest = latestFor(day, avalancheZoneId)
  if (!latest) return null
  const zones = zonesFor(latest, avalancheZoneId)
  return (
    <WeatherCard issuance={latest} timezone={timezone} inPanel={inPanel}>
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
