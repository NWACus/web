/** products-api NWAC weather source: fetches + parses the public reads, maps them into the model. */
import type { NWACWeatherForecastDay } from '../../model/nwacWeather'
import { fetchNWACWeatherForecasts } from '../../nac'
import type { NWACWeatherQuery, NWACWeatherSource } from '../types'
import { mapV3NWACWeatherForecastDay } from './nwacWeatherMappers'

export const nwacWeatherSourceV3: NWACWeatherSource = {
  async getForecastDay(query: NWACWeatherQuery = {}): Promise<NWACWeatherForecastDay | null> {
    const wire = await fetchNWACWeatherForecasts(query)
    return wire === null ? null : mapV3NWACWeatherForecastDay(wire)
  },
}
