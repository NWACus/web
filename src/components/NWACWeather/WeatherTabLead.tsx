/**
 * The top of NWAC's "Weather Forecast" tab in the forecast widget, laid out as the legacy nwac.us
 * tab was: the synopsis, the zone dropdown over its sensible weather, then the region-wide tables.
 * The zone section follows it (see WidgetZoneWeather). Rendered in the browser, so the issuance's
 * HTML arrives sanitized.
 */
import { DiscussionBody } from '@/components/forecast/DiscussionBody'
import type { NWACWeatherIssuance } from '@/services/nac/model/nwacWeather'
import { zonesFor } from '@/services/nac/nwacWeatherFormat'

import { OverallTables, overallParts } from './Overall'
import { ZoneSensiblePicker } from './ZoneSensiblePicker.client'

export function WeatherTabLead({
  issuance,
  avalancheZoneId,
}: {
  issuance: NWACWeatherIssuance
  avalancheZoneId: number
}) {
  const parts = overallParts(issuance)
  return (
    <div className="space-y-8 border-b pb-8">
      {parts.synopsis && (
        <section className="space-y-1">
          <h3 className="text-lg font-semibold">Weather Synopsis</h3>
          <DiscussionBody html={parts.synopsis} />
        </section>
      )}
      <ZoneSensiblePicker
        days={parts.sensible.days}
        rows={parts.sensible.rows}
        initialZone={zonesFor(issuance, avalancheZoneId)[0]?.id}
      />
      <OverallTables parts={parts} />
    </div>
  )
}
