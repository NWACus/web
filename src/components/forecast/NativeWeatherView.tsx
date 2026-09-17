/**
 * Presentational composition for the standalone Mountain Weather product — the native equivalent
 * of the legacy widget's Weather tab (`WeatherProduct.vue` + `WeatherContent.vue`): a title row,
 * the product's own issued time and author, its discussion, one table per zone in the center's
 * zone order, and the scope disclaimer. Pure presentation: it receives already-fetched data.
 */
import type { Weather } from '@/services/nac/model/forecast'
import { orderWeatherTables, type WeatherTableZone } from '@/services/nac/orderWeatherTables'
import type { AvalancheCenterType } from '@/services/nac/types/schemas'

import { Card, CardContent } from '@/components/ui/card'

import { DiscussionBody } from './DiscussionBody'
import { ForecastDisclaimer } from './ForecastDisclaimer'
import { ForecastErrorBoundary } from './ForecastErrorBoundary'
import { ForecastHeader } from './ForecastHeader'
import { WeatherTable } from './WeatherTable'
import { WeatherTableV1 } from './WeatherTableV1'
import { sanitizeHtml } from './sanitizeHtml'

interface NativeWeatherViewProps {
  weather: Weather
  /** The center's zones, for table order. */
  zones: WeatherTableZone[]
  timezone: string | null | undefined
  /** Avalanche center type, for the scope disclaimer's provider wording (USFS vs center name). */
  centerType: AvalancheCenterType
}

export function NativeWeatherView({
  weather,
  zones,
  timezone,
  centerType,
}: NativeWeatherViewProps) {
  return (
    <div className="container space-y-6 py-6">
      <WeatherTitleRow />

      <ForecastErrorBoundary fallbackMessage="Unable to display weather metadata">
        <ForecastHeader
          forecast={{
            published_time: weather.published_time,
            expires_time: null,
            author: weather.author,
          }}
          timezone={timezone}
        />
      </ForecastErrorBoundary>

      <ForecastErrorBoundary fallbackMessage="Unable to display the mountain weather product">
        <WeatherContent weather={weather} zones={zones} />
      </ForecastErrorBoundary>

      <ForecastDisclaimer centerType={centerType} centerName={weather.avalanche_center.name} />
    </div>
  )
}

/** The product's title row, matching the forecast page's: product name, then the scope subtitle. */
function WeatherTitleRow() {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Mountain Weather</h1>
      <p className="text-muted-foreground">All Zones</p>
    </div>
  )
}

/**
 * The discussion and the per-zone tables. A product with neither says so rather than rendering an
 * empty card: v2 can serve a `weather_data` shape we cannot tabulate, and "the product has nothing
 * we can show" must be a visible state, not a blank one.
 */
function WeatherContent({ weather, zones }: { weather: Weather; zones: WeatherTableZone[] }) {
  const discussion = weather.weather_discussion?.trim() ? weather.weather_discussion : null
  const tables = orderWeatherTables(weather.weather_data, zones)

  if (!discussion && tables.length === 0) {
    return (
      <p role="status" className="text-muted-foreground">
        This Mountain Weather product has no discussion or weather tables to display.
      </p>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {/* Sanitizing stays on the server; the body only renders it and wires up embedded media. */}
        {discussion && <DiscussionBody html={sanitizeHtml(discussion)} />}
        {tables.map((table) => (
          <ForecastErrorBoundary
            key={table.zone_id}
            fallbackMessage={`Unable to display the weather table for ${table.zone_name}`}
          >
            {'periods' in table ? <WeatherTableV1 table={table} /> : <WeatherTable table={table} />}
          </ForecastErrorBoundary>
        ))}
      </CardContent>
    </Card>
  )
}
