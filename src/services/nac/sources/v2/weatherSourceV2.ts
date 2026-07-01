/** Legacy v2 weather source: fetches+parses the v2 weather product, maps it into the model. */
import type { Weather } from '../../model/forecast'
import { fetchWeatherProduct } from '../../nac'
import type { WeatherSource } from '../types'
import { mapV2Weather } from './mappers'

export const weatherSourceV2: WeatherSource = {
  async getWeather(weatherProductId: number): Promise<Weather | null> {
    const wire = await fetchWeatherProduct(weatherProductId)
    return wire === null ? null : mapV2Weather(wire)
  },
}
