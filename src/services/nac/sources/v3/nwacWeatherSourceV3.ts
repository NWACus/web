/** products-api NWAC weather source: fetches + parses the public reads, maps them into the model. */
import type { NwacWeatherForecastDay } from '../../model/nwacWeather'
import { fetchNwacWeatherForecasts } from '../../nac'
import type { NwacWeatherQuery, NwacWeatherSource } from '../types'
import { mapV3NwacWeatherForecastDay } from './nwacWeatherMappers'

export const nwacWeatherSourceV3: NwacWeatherSource = {
  async getForecastDay(query: NwacWeatherQuery = {}): Promise<NwacWeatherForecastDay | null> {
    const wire = await fetchNwacWeatherForecasts(query)
    return wire === null ? null : mapV3NwacWeatherForecastDay(wire)
  },
}
