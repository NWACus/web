// Seed data for the NWAC station pages: the 32 pages and their station
// assignments as they stood in the retired src/constants/weatherStations.ts
// registry. Every station is one of NWAC's own loggers, so the SnowObs source
// is `nwac` throughout; names and elevations are never stored, the pages and
// the admin picker read them from SnowObs.
//
// Read by the migration and the local seed script only. Nothing at runtime
// imports this file.

export type SeedStationPage = {
  slug: string
  displayName: string
  archived: boolean
  /** Old nwac.us /weatherdata/<slug>/now/ path, kept for a future redirect. */
  legacySlug: string
  /** SnowObs station ids in page order. */
  stids: string[]
}

export const NWAC_STATION_PAGES: SeedStationPage[] = [
  {
    slug: 'hurricane-ridge',
    displayName: 'Hurricane Ridge',
    archived: false,
    legacySlug: 'hurricaneridge',
    stids: ['4'],
  },
  {
    slug: 'mt-baker-ski-area',
    displayName: 'Mt. Baker Ski Area',
    archived: false,
    legacySlug: 'mtbakerskiarea',
    stids: ['6', '5'],
  },
  {
    slug: 'newhalem',
    displayName: 'Newhalem',
    archived: false,
    legacySlug: 'newhalem',
    stids: ['59'],
  },
  {
    slug: 'white-chuck',
    displayName: 'White Chuck',
    archived: false,
    legacySlug: 'whitechuck',
    stids: ['57'],
  },
  {
    slug: 'berne',
    displayName: 'Berne',
    archived: false,
    legacySlug: 'bernemaintenancestation',
    stids: ['12'],
  },
  {
    slug: 'stevens-pass-schmidt-haus',
    displayName: 'Stevens Pass - WSDOT Schmidt Haus',
    archived: false,
    legacySlug: 'stevenshwy2',
    stids: ['13'],
  },
  {
    slug: 'stevens-pass-brooks',
    displayName: 'Stevens Pass Ski Area - Brooks Chair',
    archived: false,
    legacySlug: 'brookssnow',
    stids: ['50'],
  },
  {
    slug: 'grace-lakes',
    displayName: 'Grace Lakes & Old Faithful',
    archived: false,
    legacySlug: 'gracelakes',
    stids: ['14', '51'],
  },
  {
    slug: 'stevens-ski-area',
    displayName: 'Stevens Pass Ski Area - Tye Mill Chair, Skyline Chair',
    archived: false,
    legacySlug: 'stevensskiarea',
    stids: ['18', '17'],
  },
  {
    slug: 'alpental',
    displayName: 'Alpental Ski Area',
    archived: false,
    legacySlug: 'alpental',
    stids: ['3', '2', '1'],
  },
  {
    slug: 'mt-washington',
    displayName: 'Mt. Washington',
    archived: false,
    legacySlug: 'mtwashington',
    stids: ['20'],
  },
  {
    slug: 'snoqualmie-pass',
    displayName: 'Snoqualmie Pass',
    archived: false,
    legacySlug: 'snoqualmiepass',
    stids: ['22', '23', '21'],
  },
  {
    slug: 'crystal-mt-ski-area',
    displayName: 'Crystal Mt. Ski Area',
    archived: false,
    legacySlug: 'crystalskiarea',
    stids: ['29', '28'],
  },
  {
    slug: 'crystal-mt-green-valley',
    displayName: 'Crystal Mt. - Green Valley & Campbell Basin',
    archived: false,
    legacySlug: 'crystalgrnvalley',
    stids: ['27', '54'],
  },
  {
    slug: 'camp-muir',
    displayName: 'Camp Muir',
    archived: false,
    legacySlug: 'campmuir',
    stids: ['34'],
  },
  {
    slug: 'paradise',
    displayName: 'Paradise',
    archived: false,
    legacySlug: 'paradise',
    stids: ['35', '36'],
  },
  {
    slug: 'sunrise',
    displayName: 'Sunrise',
    archived: false,
    legacySlug: 'sunrise',
    stids: ['30', '31'],
  },
  {
    slug: 'chinook-pass',
    displayName: 'Chinook Pass',
    archived: false,
    legacySlug: 'chinookpass',
    stids: ['32', '33'],
  },
  {
    slug: 'white-pass',
    displayName: 'White Pass Ski Area',
    archived: false,
    legacySlug: 'whitepass',
    stids: ['39', '37', '49'],
  },
  {
    slug: 'mt-st-helens',
    displayName: 'Mt. St. Helens',
    archived: true,
    legacySlug: 'mtsthelens',
    stids: ['40'],
  },
  {
    slug: 'mazama',
    displayName: 'Mazama',
    archived: false,
    legacySlug: 'mazama',
    stids: ['7'],
  },
  {
    slug: 'washington-pass',
    displayName: 'Washington Pass',
    archived: false,
    legacySlug: 'washingtonpass',
    stids: ['9', '8'],
  },
  {
    slug: 'blewett-pass',
    displayName: 'Blewett Pass',
    archived: false,
    legacySlug: 'blewettpass',
    stids: ['48'],
  },
  {
    slug: 'dirtyface-mtn',
    displayName: 'Dirtyface Mt',
    archived: false,
    legacySlug: 'dirtyfacemtn',
    stids: ['10'],
  },
  {
    slug: 'lake-wenatchee',
    displayName: 'Lake Wenatchee',
    archived: false,
    legacySlug: 'lakewenatchee',
    stids: ['11'],
  },
  {
    slug: 'mission-ridge',
    displayName: 'Mission Ridge Ski Area',
    archived: false,
    legacySlug: 'missionridge',
    stids: ['25', '26', '24'],
  },
  {
    slug: 'tumwater',
    displayName: 'Tumwater Mt. & Leavenworth',
    archived: false,
    legacySlug: 'tumwater',
    stids: ['19', '53'],
  },
  {
    slug: 'mt-hood-meadows',
    displayName: 'Mt. Hood Meadows Ski Area',
    archived: false,
    legacySlug: 'mthoodmeadows',
    stids: ['42', '43'],
  },
  {
    slug: 'cascade-express',
    displayName: 'Mt. Hood Meadows - Cascade Express',
    archived: false,
    legacySlug: 'cascade_express',
    stids: ['41'],
  },
  {
    slug: 'timberline-base',
    displayName: 'Timberline Lodge',
    archived: false,
    legacySlug: 'timberlinebase',
    stids: ['44', '56'],
  },
  {
    slug: 'timberline-upper',
    displayName: 'Timberline - Magic Mile Chair',
    archived: false,
    legacySlug: 'timberlineupper',
    stids: ['45'],
  },
  {
    slug: 'skibowl-ski-area',
    displayName: 'Skibowl Ski Area - Government Camp',
    archived: false,
    legacySlug: 'skibowlgovtcamp',
    stids: ['47', '46'],
  },
]

// The Accumulated Precipitation table's stations: the loggers above with a
// precipitation gauge, in page order. Checked against SnowObs on 2026-09-18
// (a station whose latest observations carry `precip_accum_one_hour`); the
// admin marks any that stop reporting.
export const NWAC_PRECIP_STATIONS: string[] = [
  '4',
  '5',
  '12',
  '13',
  '50',
  '1',
  '21',
  '28',
  '35',
  '33',
  '39',
  '7',
  '8',
  '48',
  '11',
  '53',
  '43',
  '44',
  '46',
]
