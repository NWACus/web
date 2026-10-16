/**
 * The zone's Mountain Weather under its avalanche forecast: one issuance at a time (newest first,
 * with a switch to the other), each leading with the zone's sensible weather and table, then an
 * Overall section: the region-wide synopsis. The extended outlook and its snow levels are left
 * to the Mountain Weather page. Rendered in the browser (it goes into the widget, see
 * WidgetZoneWeather), so the synopsis arrives already sanitized by the route that serves the day.
 */
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import type { NWACWeatherForecastDay, NWACWeatherIssuance } from '@/services/nac/model/nwacWeather'
import { issuanceLabel, issuanceShortLabel, zonesFor } from '@/services/nac/nwacWeatherFormat'

import { DiscussionBody } from '@/components/forecast/DiscussionBody'
import { IssuanceSwitch } from './IssuanceSwitch.client'

import { IssuedMeta, formatIssued } from './Issued'
import { ZoneTable } from './ZoneTable'

interface ZoneSummaryProps {
  day: NWACWeatherForecastDay
  avalancheZoneId: number
  timezone: string | null | undefined
}

function textOrNull(html: string | null | undefined): string | null {
  return html?.trim() ? html : null
}

/** The region-wide part: the synopsis. Nothing when the issuance has none. */
function OverallSection({ issuance }: { issuance: NWACWeatherIssuance }) {
  const synopsis = textOrNull(issuance.synopsis)
  if (!synopsis) return null
  const headingId = `nwac-weather-overall-${issuance.id}`
  return (
    <section aria-labelledby={headingId} className="space-y-4 border-t pt-6">
      <h3 id={headingId} className="text-lg font-semibold">
        Overall
      </h3>
      <section className="space-y-2">
        <h4 className="text-base font-semibold">Weather Synopsis</h4>
        <DiscussionBody html={synopsis} />
      </section>
    </section>
  )
}

function IssuancePanel({
  issuance,
  avalancheZoneId,
}: {
  issuance: NWACWeatherIssuance
  avalancheZoneId: number
}) {
  const zones = zonesFor(issuance, avalancheZoneId)
  return (
    <section aria-label={issuanceLabel(issuance.type)} className="space-y-6">
      {zones.map((zone) => (
        <ZoneTable key={zone.id} issuance={issuance} zone={zone} heading={zones.length > 1} />
      ))}
      <OverallSection issuance={issuance} />
    </section>
  )
}

export function ZoneSummary({ day, avalancheZoneId, timezone }: ZoneSummaryProps) {
  const issuances = day.issuances.filter((i) => zonesFor(i, avalancheZoneId).length > 0)
  if (issuances.length === 0) return null

  return (
    <Card
      id="mountain-weather"
      className="scroll-mt-24 rounded-none border-0 bg-transparent pb-8 shadow-none"
    >
      <CardContent className="space-y-6 p-0">
        <IssuanceSwitch
          heading={<CardTitle>Mountain Weather</CardTitle>}
          headerClassName="sm:items-center"
          panels={issuances.map((issuance) => ({
            key: String(issuance.id),
            label: issuanceShortLabel(issuance.type),
            time: formatIssued(issuance.issuedAt, timezone, 'h:mm a'),
            meta: <IssuedMeta issuance={issuance} timezone={timezone} />,
            content: <IssuancePanel issuance={issuance} avalancheZoneId={avalancheZoneId} />,
          }))}
        />
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
