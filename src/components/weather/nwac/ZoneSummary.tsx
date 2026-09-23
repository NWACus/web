/**
 * The zone's Mountain Weather on its avalanche forecast page: one issuance at a time (newest
 * first, with a switch to the other), each leading with the zone's sensible weather and table,
 * then an Overall section: the region-wide synopsis and the extended outlook. Takes the same slot
 * the AFP weather product's WeatherSummary does, so print, error isolation and the "Mountain
 * Weather" heading behave the same for either source.
 */
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type {
  NwacWeatherForecastDay,
  NwacWeatherIssuance,
  NwacWeatherZone,
} from '@/services/nac/model/nwacWeather'
import { issuanceLabel, issuanceShortLabel, zonesFor } from '@/services/nac/nwacWeatherFormat'

import { IssuanceSwitch } from './IssuanceSwitch.client'
import { IssuedLine, formatIssued } from './Issued'
import { RichText, textOrNull } from './RichText'
import { ZoneExtended, ZoneTable } from './ZoneTable'

interface ZoneSummaryProps {
  day: NwacWeatherForecastDay
  avalancheZoneId: number
  timezone: string | null | undefined
}

function hasOutlook(
  issuance: NwacWeatherIssuance,
  zones: NwacWeatherZone[],
  extended: string | null,
) {
  return !!extended || zones.some((z) => issuance.extendedSnowLevel[z.id])
}

function ExtendedOutlook({
  issuance,
  zones,
  extended,
}: {
  issuance: NwacWeatherIssuance
  zones: NwacWeatherZone[]
  extended: string | null
}) {
  return (
    <section className="space-y-3">
      <h4 className="text-base font-semibold">Extended Outlook</h4>
      {extended && <RichText html={extended} />}
      {zones.map((zone) => (
        <ZoneExtended key={zone.id} issuance={issuance} zone={zone} />
      ))}
    </section>
  )
}

/** The region-wide part: synopsis and extended outlook. Nothing when the issuance has neither. */
function OverallSection({
  issuance,
  zones,
}: {
  issuance: NwacWeatherIssuance
  zones: NwacWeatherZone[]
}) {
  const synopsis = textOrNull(issuance.synopsis)
  const extended = textOrNull(issuance.extendedOutlook)
  const outlook = hasOutlook(issuance, zones, extended)
  if (!synopsis && !outlook) return null
  const headingId = `nwac-weather-overall-${issuance.id}`
  return (
    <section aria-labelledby={headingId} className="space-y-4 border-t pt-6">
      <h3 id={headingId} className="text-lg font-semibold">
        Overall
      </h3>
      {synopsis && (
        <section className="space-y-2">
          <h4 className="text-base font-semibold">Weather Synopsis</h4>
          <RichText html={synopsis} />
        </section>
      )}
      {outlook && <ExtendedOutlook issuance={issuance} zones={zones} extended={extended} />}
    </section>
  )
}

function IssuancePanel({
  issuance,
  avalancheZoneId,
  timezone,
}: {
  issuance: NwacWeatherIssuance
  avalancheZoneId: number
  timezone: string | null | undefined
}) {
  const zones = zonesFor(issuance, avalancheZoneId)
  return (
    <section aria-label={issuanceLabel(issuance.type)} className="space-y-6">
      <IssuedLine issuance={issuance} timezone={timezone} />
      {zones.map((zone) => (
        <ZoneTable key={zone.id} issuance={issuance} zone={zone} heading={zones.length > 1} />
      ))}
      <OverallSection issuance={issuance} zones={zones} />
    </section>
  )
}

export function ZoneSummary({ day, avalancheZoneId, timezone }: ZoneSummaryProps) {
  const issuances = day.issuances.filter((i) => zonesFor(i, avalancheZoneId).length > 0)
  if (issuances.length === 0) return null

  return (
    <Card id="mountain-weather" className="scroll-mt-24">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>Mountain Weather</CardTitle>
        <Link
          href="/weather/forecast"
          className="inline-flex items-center gap-1 text-sm font-semibold hover:underline print:hidden"
        >
          Full Mountain Weather Forecast
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <IssuanceSwitch
          panels={issuances.map((issuance) => ({
            key: String(issuance.id),
            label: issuanceShortLabel(issuance.type),
            time: formatIssued(issuance.issuedAt, timezone, 'h:mm a'),
            content: (
              <IssuancePanel
                issuance={issuance}
                avalancheZoneId={avalancheZoneId}
                timezone={timezone}
              />
            ),
          }))}
        />
      </CardContent>
    </Card>
  )
}
