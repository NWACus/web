/**
 * Where a widget-rendered zone page gets NWAC's Mountain Weather: NWAC authors it in products-api,
 * which the widget can't read, so the page fills it in (see WidgetZoneWeather). Nothing for any
 * other center, whose weather the widget shows itself.
 */
import { getAvalancheCenterMetadata } from '@/services/nac/nac'

import { WidgetZoneWeather } from './WidgetZoneWeather.client'

export async function WidgetZoneWeatherSlot({ center }: { center: string }) {
  if (center !== 'nwac') return null
  const { timezone } = await getAvalancheCenterMetadata(center)
  return <WidgetZoneWeather center={center} timezone={timezone} />
}
