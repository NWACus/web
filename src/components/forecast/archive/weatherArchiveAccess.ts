/**
 * Whether a center's forecast archive has a Mountain Weather tab, and whether it renders natively.
 * Shared by the tab's list route and the archived-product route so the two cannot disagree.
 *
 * The tab needs the AFP's weather capability on top of the archive's forecast one: a center with
 * no NAC weather product (NWAC authors its own) has nothing to list. Natively, it follows both
 * rollout flags — the forecast flag because it is part of the archive browser, the weather flag
 * because its rows open weather products.
 */
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'

export interface WeatherArchiveAccess {
  /** The forecast rollout flag, which the rest of the archive follows. */
  useNativeForecast: boolean
  /** The center publishes forecasts and weather through the NAC, so the tab exists at all. */
  available: boolean
  /** The tab and its products render natively rather than in the legacy widget. */
  native: boolean
}

export async function getWeatherArchiveAccess(center: string): Promise<WeatherArchiveAccess> {
  const [platforms, useNativeForecast, useNativeWeather] = await Promise.all([
    getAvalancheCenterPlatforms(center),
    getNativeProductFlag(center, 'forecast'),
    getNativeProductFlag(center, 'weather'),
  ])

  const available = platforms.forecasts && platforms.weather
  return {
    useNativeForecast,
    available,
    native: available && useNativeForecast && useNativeWeather,
  }
}
