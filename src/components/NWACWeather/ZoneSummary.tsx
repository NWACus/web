/**
 * The zone's Mountain Weather under its avalanche forecast: the latest issuance only, as the zone's
 * sensible weather and table, without the synopsis or extended outlook. Rendered in the browser
 * (it goes into the widget, see WidgetZoneWeather).
 */
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import type { NWACWeatherForecastDay } from '@/services/nac/model/nwacWeather'
import { issuanceLabel, zonesFor } from '@/services/nac/nwacWeatherFormat'

import { IssuedMeta } from './Issued'
import { ZoneTable } from './ZoneTable'

interface ZoneSummaryProps {
  day: NWACWeatherForecastDay
  avalancheZoneId: number
  timezone: string | null | undefined
}

export function ZoneSummary({ day, avalancheZoneId, timezone }: ZoneSummaryProps) {
  // The day's issuances come newest first.
  const latest = day.issuances.find((i) => zonesFor(i, avalancheZoneId).length > 0)
  if (!latest) return null
  const zones = zonesFor(latest, avalancheZoneId)

  return (
    <Card
      id="mountain-weather"
      className="scroll-mt-24 rounded-none border-0 bg-transparent pb-8 shadow-none"
    >
      <CardContent className="space-y-6 p-0">
        <header className="space-y-1">
          <CardTitle>Mountain Weather</CardTitle>
          <p className="text-sm font-medium">{issuanceLabel(latest.type)}</p>
          <IssuedMeta issuance={latest} timezone={timezone} />
        </header>
        {zones.map((zone) => (
          <ZoneTable key={zone.id} issuance={latest} zone={zone} heading={zones.length > 1} />
        ))}
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
