/** Legacy v2 weather source: fetches+parses the v2 weather product, maps it into the model. */
import type { Weather } from '../../model/forecast'
import {
  fetchCurrentWeatherProduct,
  fetchCurrentWeatherProductFresh,
  fetchWeatherProduct,
  fetchWeatherProductForDate,
} from '../../nac'
import type { WeatherSource } from '../types'
import { mapV2Weather } from './mappers'

export const weatherSourceV2: WeatherSource = {
  async getWeather(weatherProductId: number): Promise<Weather | null> {
    const wire = await fetchWeatherProduct(weatherProductId)
    return wire === null ? null : mapV2Weather(wire)
  },
  async getCurrentWeather(centerId: string, zoneId: number): Promise<Weather | null> {
    const wire = await fetchCurrentWeatherProduct(centerId, zoneId)
    return wire === null ? null : mapV2Weather(wire)
  },
  async getCurrentWeatherFresh(centerId: string, zoneId: number): Promise<Weather | null> {
    const wire = await fetchCurrentWeatherProductFresh(centerId, zoneId)
    return wire === null ? null : mapV2Weather(wire)
  },
  async getWeatherForDate(centerId: string, zoneId: number, date: string): Promise<Weather | null> {
    const wire = await fetchWeatherProductForDate(centerId, zoneId, date)
    return wire === null ? null : mapV2Weather(wire)
  },
}
