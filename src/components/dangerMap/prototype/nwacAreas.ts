/**
 * PROTOTYPE ONLY — NWAC zones in geographic reading order, with the places readers know them by.
 * The area lists are a first draft from public knowledge; forecasters should correct them.
 */
export const NWAC_ZONE_AREAS: { name: string; areas: string[] }[] = [
  { name: 'Olympics', areas: ['Hurricane Ridge', 'Olympic National Park'] },
  {
    name: 'West Slopes North',
    areas: ['Mt Baker Ski Area', 'Heather Meadows', 'Mt Shuksan', 'Hwy 20 (west)'],
  },
  {
    name: 'West Slopes Central',
    areas: ['Mountain Loop Hwy', 'Glacier Peak (west)', 'Darrington', 'Index'],
  },
  { name: 'Stevens Pass', areas: ['Stevens Pass Ski Area', 'Hwy 2 at the crest', 'Yodelin'] },
  { name: 'Snoqualmie Pass', areas: ['Alpental', 'Summit at Snoqualmie', 'I-90 at the crest'] },
  {
    name: 'West Slopes South',
    areas: ['Crystal Mountain', 'Mt Rainier / Paradise', 'White Pass', 'Mt St Helens'],
  },
  {
    name: 'East Slopes North',
    areas: ['Washington Pass', 'Rainy Pass', 'Harts Pass', 'Methow Valley'],
  },
  {
    name: 'East Slopes Central',
    areas: ['Leavenworth', 'Icicle Creek', 'Enchantments', 'Blewett Pass', 'Lake Wenatchee'],
  },
  {
    name: 'East Slopes South',
    areas: ['Hwy 410 & Hwy 12 (east)', 'Goat Rocks (east)', 'Mt Adams'],
  },
  { name: 'Mt Hood', areas: ['Timberline', 'Mt Hood Meadows', 'Government Camp', 'Hwy 35'] },
]

/** Zone names in NWAC_ZONE_AREAS order first, then anything else alphabetically. */
export function zoneOrder(name: string): number {
  const index = NWAC_ZONE_AREAS.findIndex((zone) => zone.name === name)
  return index === -1 ? NWAC_ZONE_AREAS.length : index
}

export function areasFor(name: string): string[] {
  return NWAC_ZONE_AREAS.find((zone) => zone.name === name)?.areas ?? []
}
