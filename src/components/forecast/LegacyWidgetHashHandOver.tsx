/**
 * The native forecast pages' reader of old widget links (Forecast-244): the zone page and the
 * all-zones page, where the widget kept every forecast route under the hash.
 */
import { getWeatherArchiveAccess } from '@/components/forecast/archive/weatherArchiveAccess'
import { getActiveForecastZones } from '@/services/nac/nac'

import { LegacyWidgetHashHandOverClient } from './LegacyWidgetHashHandOver.client'

export async function LegacyWidgetHashHandOver({ center }: { center: string }) {
  const [zones, weatherArchive] = await Promise.all([
    getActiveForecastZones(center),
    getWeatherArchiveAccess(center),
  ])

  return (
    <LegacyWidgetHashHandOverClient
      center={center}
      zones={zones.map(({ slug, zone }) => ({ name: zone.name, slug }))}
      weatherArchive={weatherArchive.available}
    />
  )
}
