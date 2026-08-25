// Which experience the /[center]/weather/forecast route serves. The MWF
// Settings flag takes precedence over the NAC platforms.weather capability —
// NWAC's platforms.weather is hardcoded false upstream precisely because NWAC
// forecasts weather in-house, so the native MWF page must not gate on it.
export type WeatherForecastPageMode = 'native-mwf' | 'widget' | 'not-found'

export function weatherForecastPageMode({
  mwfEnabled,
  platformsWeather,
}: {
  mwfEnabled: boolean
  platformsWeather: boolean
}): WeatherForecastPageMode {
  if (mwfEnabled) return 'native-mwf'
  if (platformsWeather) return 'widget'
  return 'not-found'
}
