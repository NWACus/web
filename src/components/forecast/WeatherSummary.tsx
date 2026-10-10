/**
 * Inline "Mountain Weather" section of the forecast panel. The mountain-weather product is issued
 * separately from the forecast, so it carries its own author/issued time and discussion. Shows the
 * viewed zone's table only (see `zoneWeather`), shape-detecting the two table formats via a
 * `periods` key. Renders nothing when there is neither a table nor discussion.
 */
import type { Weather } from '@/services/nac/model/forecast'

import { GlossaryProse } from '@/components/glossary/GlossaryProse.client'

import { ForecastHeader } from './ForecastHeader'
import { sectionHeading } from './forecastHeadings'
import { forecastProse } from './forecastProse'
import { sanitizeHtml } from './sanitizeHtml'
import { WeatherTable } from './WeatherTable'
import { WeatherTableV1 } from './WeatherTableV1'
import { zoneWeather } from './zoneWeather'

interface WeatherSummaryProps {
  weather: Weather
  /** The viewed zone's short `zone_id` string, which weather tables are keyed by. */
  zoneId: string
  timezone: string | null | undefined
}

export function WeatherSummary({ weather, zoneId, timezone }: WeatherSummaryProps) {
  const content = zoneWeather(weather, zoneId)
  if (!content) return null

  const { table, discussion } = content

  return (
    <section className="space-y-4">
      <h2 className={sectionHeading}>Mountain Weather</h2>
      <ForecastHeader
        forecast={{
          published_time: weather.published_time,
          expires_time: null,
          author: weather.author,
        }}
        timezone={timezone}
      />
      {discussion && <GlossaryProse html={sanitizeHtml(discussion)} className={forecastProse} />}
      {table &&
        ('periods' in table ? <WeatherTableV1 table={table} /> : <WeatherTable table={table} />)}
    </section>
  )
}
