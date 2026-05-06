export type SeedForecastZone = {
  slug: string
  name: string
  rank: number
}

// Hardcoded zone data so seeding doesn't require internet connectivity.
// dvac shares NWAC's forecast data, so it reuses NWAC zones.
const nwacZones: SeedForecastZone[] = [
  { slug: 'olympics', name: 'Olympics', rank: 1 },
  { slug: 'west-slopes-north', name: 'West Slopes North', rank: 2 },
  { slug: 'west-slopes-central', name: 'West Slopes Central', rank: 3 },
  { slug: 'west-slopes-south', name: 'West Slopes South', rank: 4 },
  { slug: 'stevens-pass', name: 'Stevens Pass', rank: 5 },
  { slug: 'snoqualmie-pass', name: 'Snoqualmie Pass', rank: 9 },
  { slug: 'east-slopes-north', name: 'East Slopes North', rank: 10 },
  { slug: 'east-slopes-central', name: 'East Slopes Central', rank: 11 },
  { slug: 'east-slopes-south', name: 'East Slopes South', rank: 12 },
  { slug: 'mt-hood', name: 'Mt Hood', rank: 13 },
]

export const forecastZonesByTenant: Record<string, SeedForecastZone[]> = {
  nwac: nwacZones,
  dvac: nwacZones,
  sac: [{ slug: 'central-sierra-nevada', name: 'Central Sierra Nevada', rank: 1 }],
  snfac: [
    { slug: 'galena-summit-&-eastern-mtns', name: 'Galena Summit & Eastern Mtns', rank: 1 },
    {
      slug: 'soldier-&-wood-river-valley-mtns',
      name: 'Soldier & Wood River Valley Mtns',
      rank: 2,
    },
    { slug: 'sawtooth-&-western-smoky-mtns', name: 'Sawtooth & Western Smoky Mtns', rank: 3 },
    { slug: 'banner-summit', name: 'Banner Summit', rank: 4 },
  ],
}
