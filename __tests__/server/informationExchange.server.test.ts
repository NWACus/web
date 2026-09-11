import { isInformationExchange } from '@/services/nac/informationExchange'

// Shapes captured from the live capability feed (`/v1/public/avalanche-centers`, 2026-09-10).
const platforms = {
  // Eastern Wyoming / Southern Oregon Avalanche Info Exchange
  exchange: { warnings: false, forecasts: false, stations: true, obs: true, weather: false },
  nwac: { warnings: true, forecasts: true, stations: true, obs: true, weather: false },
  // Utah issues warnings and runs stations but, on the feed, forecasts nowhere and has no obs
  uac: { warnings: true, forecasts: false, stations: true, obs: false, weather: false },
  // Colorado is on the feed with nothing enabled at all
  caic: { warnings: false, forecasts: false, stations: false, obs: false, weather: false },
  // Cordova: observations only, no stations — an exchange in everything but name
  cac: { warnings: false, forecasts: false, stations: false, obs: true, weather: false },
}

describe('isInformationExchange', () => {
  it('recognizes a center that collects observations but issues no forecasts', () => {
    expect(isInformationExchange(platforms.exchange)).toBe(true)
  })

  it('is not fooled by a forecasting center that also collects observations', () => {
    expect(isInformationExchange(platforms.nwac)).toBe(false)
  })

  // Without an observations platform there is nothing for the danger map to pivot to, so these
  // stay ordinary (if empty) danger maps rather than pointing readers at a page that 404s.
  it.each([
    ['warnings-only', platforms.uac],
    ['no platforms at all', platforms.caic],
  ])('does not classify a %s center as an exchange', (_case, value) => {
    expect(isInformationExchange(value)).toBe(false)
  })

  // The widget keys on the `AIX` id suffix; the capability rule reaches the same two centers
  // and also the observation-only centers the suffix misses.
  it('classifies an observation-only center by capability, not by name', () => {
    expect(isInformationExchange(platforms.cac)).toBe(true)
  })
})
