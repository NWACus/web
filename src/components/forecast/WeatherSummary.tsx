/**
 * Inline "Weather Summary" section for the forecast view. The mountain-weather product is issued
 * separately from the forecast, so it carries its own author/issued time and discussion. Selects
 * the table for the viewed zone (by name, falling back to the first), then shape-detects the two
 * table formats via a `periods` key. Renders nothing when there is neither a table nor discussion.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type {
  InlineWeatherData,
  RowColumnWeatherData,
  Weather,
} from '@/services/nac/model/forecast'

import { ForecastHeader } from './ForecastHeader'
import { sanitizeHtml } from './sanitizeHtml'
import { WeatherTable } from './WeatherTable'
import { WeatherTableV1 } from './WeatherTableV1'

type WeatherTableData = RowColumnWeatherData | InlineWeatherData

function selectTable(tables: WeatherTableData[], zoneName: string): WeatherTableData | null {
  if (tables.length === 0) return null
  return tables.find((t) => t.zone_name === zoneName) ?? tables[0]
}

interface WeatherSummaryProps {
  weather: Weather
  zoneName: string
  timezone: string | null | undefined
}

export function WeatherSummary({ weather, zoneName, timezone }: WeatherSummaryProps) {
  const table = selectTable(weather.weather_data, zoneName)
  const discussion = weather.weather_discussion?.trim() ? weather.weather_discussion : null

  if (!table && !discussion) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ForecastHeader
          forecast={{
            published_time: weather.published_time,
            expires_time: null,
            author: weather.author,
          }}
          timezone={timezone}
        />
        {discussion && (
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(discussion) }}
          />
        )}
        {table &&
          ('periods' in table ? <WeatherTableV1 table={table} /> : <WeatherTable table={table} />)}
      </CardContent>
    </Card>
  )
}
