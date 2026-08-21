/**
 * Weather station collections, plus the registry they replace.
 *
 * Seeds the 14 index regions, the 60 SnowObs stations and the 32 pages that
 * currently live in `src/constants/weatherStations.ts`, so the data is in place
 * before anything reads it. The station rows are a point-in-time snapshot; the
 * hourly sync corrects anything stale on its first run.
 *
 * Column layout is not seeded because it is no longer stored: each station
 * carries the readings it contributes to the NOW table, and the group's station
 * order decides how they interleave.
 *
 * Holds its own copy of the data rather than importing the constants, so it
 * keeps working once those are deleted.
 */
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

const TENANT_SLUG = 'nwac'
const SOURCE = 'nwac'

const REGIONS: { name: string; slug: string; rank: number }[] = [
  { name: 'Olympics', slug: 'olympics', rank: 1 },
  { name: 'Mt Baker', slug: 'mt-baker', rank: 2 },
  { name: 'SR20 West', slug: 'sr20-west', rank: 3 },
  { name: 'Mountain Loop', slug: 'mountain-loop', rank: 4 },
  { name: 'Stevens Pass', slug: 'stevens-pass', rank: 5 },
  { name: 'Snoqualmie Pass', slug: 'snoqualmie-pass', rank: 6 },
  { name: 'Crystal Mt.', slug: 'crystal-mt', rank: 7 },
  { name: 'Mt Rainier', slug: 'mt-rainier', rank: 8 },
  { name: 'Chinook Pass', slug: 'chinook-pass', rank: 9 },
  { name: 'White Pass', slug: 'white-pass', rank: 10 },
  { name: 'Mt St Helens', slug: 'mt-st-helens', rank: 11 },
  { name: 'Washington Pass', slug: 'washington-pass', rank: 12 },
  { name: 'Lake Wenatchee to Mission Ridge', slug: 'lake-wenatchee-to-mission-ridge', rank: 13 },
  { name: 'Mt Hood', slug: 'mt-hood', rank: 14 },
]

type SeedStation = {
  stid: string
  name: string | null
  elevation: number | null
  latitude: number | null
  longitude: number | null
  partner: string | null
  tableVariables: string[]
}

const STATIONS: SeedStation[] = [
  {
    stid: '1',
    name: 'Alpental Base',
    elevation: 3100.0,
    latitude: 47.444066667,
    longitude: -121.42485,
    partner: 'Alpental Ski Area',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth_24h',
      'snow_depth',
    ],
  },
  {
    stid: '2',
    name: 'Alpental Mid-Mountain',
    elevation: 4350.0,
    latitude: 47.4347404,
    longitude: -121.433565,
    partner: 'Alpental Ski Area',
    tableVariables: ['air_temp', 'snow_depth_24h', 'snow_depth'],
  },
  {
    stid: '3',
    name: 'Alpental Summit',
    elevation: 5470.0,
    latitude: 47.438816667,
    longitude: -121.442616667,
    partner: 'Alpental Ski Area',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed',
      'wind_gust',
      'wind_direction',
      'intermittent_snow',
    ],
  },
  {
    stid: '4',
    name: 'Hurricane Ridge',
    elevation: 5250.0,
    latitude: 47.9704,
    longitude: -123.499333333,
    partner: 'Olympic National Park',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
      'precip_accum_one_hour',
      'snow_depth',
      'solar_radiation',
    ],
  },
  {
    stid: '5',
    name: 'Mt. Baker - Heather Meadows',
    elevation: 4210.0,
    latitude: 48.863016667,
    longitude: -121.67785,
    partner: 'Mt. Baker Ski Area',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth_24h',
      'snow_depth',
    ],
  },
  {
    stid: '6',
    name: 'Mt. Baker - Pan Dome',
    elevation: 5020.0,
    latitude: 48.85305,
    longitude: -121.6772,
    partner: 'Mt. Baker Ski Area',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
      'solar_radiation',
    ],
  },
  {
    stid: '7',
    name: 'Mazama',
    elevation: 2170.0,
    latitude: 48.597283333,
    longitude: -120.437433333,
    partner: 'Freestone Inn',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed',
      'wind_gust',
      'wind_direction',
      'precip_accum_one_hour',
      'snow_depth_24h',
      'snow_depth',
      'solar_radiation',
    ],
  },
  {
    stid: '8',
    name: 'Washington Pass Base',
    elevation: 5450.0,
    latitude: 48.525783333,
    longitude: -120.65525,
    partner: 'WSDOT',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth',
      'equip_temperature',
    ],
  },
  {
    stid: '9',
    name: 'Washington Pass Upper',
    elevation: 6680.0,
    latitude: 48.533283333,
    longitude: -120.649733333,
    partner: 'WSDOT',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
    ],
  },
  {
    stid: '10',
    name: 'Dirtyface Summit',
    elevation: 5980.0,
    latitude: 47.855716667,
    longitude: -120.7993,
    partner: 'USFS',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
    ],
  },
  {
    stid: '11',
    name: 'Lake Wenatchee',
    elevation: 1930.0,
    latitude: 47.813516667,
    longitude: -120.722916667,
    partner: 'WA State Parks & Rec',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth_24h',
      'snow_depth',
    ],
  },
  {
    stid: '12',
    name: 'Berne',
    elevation: 2700.0,
    latitude: 47.775016667,
    longitude: -120.965983333,
    partner: 'WSDOT',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth_24h',
      'snow_depth',
      'pressure',
    ],
  },
  {
    stid: '13',
    name: 'Stevens Pass - Schmidt Haus',
    elevation: 3950.0,
    latitude: 47.746133333,
    longitude: -121.092633333,
    partner: 'WSDOT',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth_24h',
      'snow_depth',
      'pressure',
    ],
  },
  {
    stid: '14',
    name: 'Stevens Pass - Grace Lakes',
    elevation: 4790.0,
    latitude: 47.74085,
    longitude: -121.117083333,
    partner: 'WSDOT',
    tableVariables: ['air_temp', 'relative_humidity', 'snow_depth', 'intermittent_snow'],
  },
  {
    stid: '15',
    name: 'Stevens Pass - Brooks Wind (Retired 2019)',
    elevation: 4850.0,
    latitude: 47.73815,
    longitude: -121.106616667,
    partner: 'Stevens Pass Ski Area',
    tableVariables: [],
  },
  {
    stid: '17',
    name: 'Stevens Pass - Skyline',
    elevation: 5250.0,
    latitude: 47.734,
    longitude: -121.1081,
    partner: 'Stevens Pass Ski Area',
    tableVariables: ['air_temp', 'relative_humidity'],
  },
  {
    stid: '18',
    name: 'Stevens Pass - Tye Mill',
    elevation: 5180.0,
    latitude: 47.731633333,
    longitude: -121.0853,
    partner: 'Stevens Pass Ski Area',
    tableVariables: ['air_temp', 'wind_speed_min', 'wind_speed', 'wind_gust', 'wind_direction'],
  },
  {
    stid: '19',
    name: 'Tumwater Mountain',
    elevation: 4180.0,
    latitude: 47.628333333,
    longitude: -120.707166667,
    partner: 'WSDOT',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
      'snow_depth',
    ],
  },
  {
    stid: '20',
    name: 'Mt. Washington',
    elevation: 4340.0,
    latitude: 47.425933333,
    longitude: -121.699383333,
    partner: 'WSDOT',
    tableVariables: ['air_temp', 'relative_humidity', 'wind_direction', 'solar_radiation'],
  },
  {
    stid: '21',
    name: 'Snoqualmie Pass',
    elevation: 3010.0,
    latitude: 47.424866667,
    longitude: -121.41395,
    partner: 'WSDOT',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth_24h',
      'snow_depth',
      'pressure',
    ],
  },
  {
    stid: '22',
    name: 'Snoqualmie Pass - Dodge Ridge',
    elevation: 3760.0,
    latitude: 47.4204,
    longitude: -121.427533333,
    partner: 'WSDOT',
    tableVariables: ['air_temp', 'wind_speed_min', 'wind_speed', 'wind_gust', 'wind_direction'],
  },
  {
    stid: '23',
    name: 'Snoqualmie Pass - East Shed',
    elevation: 3770.0,
    latitude: 47.357233333,
    longitude: -121.360333333,
    partner: 'WSDOT',
    tableVariables: ['air_temp'],
  },
  {
    stid: '24',
    name: 'Mission Ridge Base',
    elevation: 4610.0,
    latitude: 47.29125,
    longitude: -120.399383333,
    partner: 'Mission Ridge Ski Area',
    tableVariables: ['air_temp'],
  },
  {
    stid: '25',
    name: 'Mission Ridge Summit',
    elevation: 6730.0,
    latitude: 47.27495,
    longitude: -120.427416667,
    partner: 'Mission Ridge Ski Area',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
    ],
  },
  {
    stid: '26',
    name: 'Mission Ridge Mid-Mountain',
    elevation: 5160.0,
    latitude: 47.285983333,
    longitude: -120.410816667,
    partner: 'Mission Ridge Ski Area',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth_24h',
      'snow_depth',
    ],
  },
  {
    stid: '27',
    name: 'Crystal - Green Valley',
    elevation: 6230.0,
    latitude: 46.939433333,
    longitude: -121.494333333,
    partner: 'Crystal Mt. Ski Area',
    tableVariables: ['air_temp', 'relative_humidity', 'snow_depth_24h', 'snow_depth'],
  },
  {
    stid: '28',
    name: 'Crystal Base',
    elevation: 4540.0,
    latitude: 46.9305,
    longitude: -121.47578,
    partner: 'Crystal Mt. Ski Area',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth_24h',
      'snow_depth',
    ],
  },
  {
    stid: '29',
    name: 'Crystal Summit',
    elevation: 6830.0,
    latitude: 46.93505,
    longitude: -121.500433333,
    partner: 'Crystal Mt. Ski Area',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
    ],
  },
  {
    stid: '30',
    name: 'Sunrise Upper',
    elevation: 6880.0,
    latitude: 46.919183333,
    longitude: -121.6516,
    partner: 'Mt. Rainier National Park',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
    ],
  },
  {
    stid: '31',
    name: 'Sunrise Base',
    elevation: 6410.0,
    latitude: 46.914366667,
    longitude: -121.644166667,
    partner: 'Mt. Rainier National Park',
    tableVariables: ['air_temp', 'relative_humidity', 'snow_depth'],
  },
  {
    stid: '32',
    name: 'Chinook Pass Summit',
    elevation: 6240.0,
    latitude: 46.880533333,
    longitude: -121.519566667,
    partner: 'WSDOT',
    tableVariables: ['air_temp', 'relative_humidity', 'wind_speed', 'wind_gust', 'wind_direction'],
  },
  {
    stid: '33',
    name: 'Chinook Pass Base',
    elevation: 5500.0,
    latitude: 46.873266667,
    longitude: -121.517383333,
    partner: 'WSDOT',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth',
      'equip_temperature',
    ],
  },
  {
    stid: '34',
    name: 'Camp Muir',
    elevation: 10110.0,
    latitude: 46.835416667,
    longitude: -121.73305,
    partner: 'Mt. Rainier National Park',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
      'solar_radiation',
    ],
  },
  {
    stid: '35',
    name: 'Paradise',
    elevation: 5400.0,
    latitude: 46.786216667,
    longitude: -121.7424,
    partner: 'Mt. Rainier National Park',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth_24h',
      'snow_depth',
    ],
  },
  {
    stid: '36',
    name: 'Paradise Wind',
    elevation: 5380.0,
    latitude: 46.784866667,
    longitude: -121.7419,
    partner: 'Mt. Rainier National Park',
    tableVariables: [
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
      'solar_radiation',
    ],
  },
  {
    stid: '37',
    name: 'White Pass Base',
    elevation: 4500.0,
    latitude: 46.63678,
    longitude: -121.3915,
    partner: 'White Pass Ski Area',
    tableVariables: ['air_temp', 'relative_humidity'],
  },
  {
    stid: '39',
    name: 'White Pass Upper',
    elevation: 5800.0,
    latitude: 46.620766667,
    longitude: -121.387366667,
    partner: 'White Pass Ski Area',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth_24h',
      'snow_depth',
    ],
  },
  {
    stid: '40',
    name: 'Mt. St. Helens - Coldwater',
    elevation: 3260.0,
    latitude: 46.303333333,
    longitude: -122.265033333,
    partner: 'USFS',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
      'precip_accum_one_hour',
    ],
  },
  {
    stid: '41',
    name: 'Mt. Hood Meadows - Cascade Express',
    elevation: 7300.0,
    latitude: 45.349266667,
    longitude: -121.681633333,
    partner: 'Mt. Hood Meadows Ski Area',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
    ],
  },
  {
    stid: '42',
    name: 'Mt. Hood Meadows - Blue',
    elevation: 6540.0,
    latitude: 45.343566667,
    longitude: -121.672266667,
    partner: 'Mt. Hood Meadows Ski Area',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
    ],
  },
  {
    stid: '43',
    name: 'Mt. Hood Meadows Base',
    elevation: 5380.0,
    latitude: 45.332633333,
    longitude: -121.666033333,
    partner: 'Mt. Hood Meadows Ski Area',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth_24h',
      'snow_depth',
      'pressure',
    ],
  },
  {
    stid: '44',
    name: 'Timberline Lodge',
    elevation: 5800.0,
    latitude: 45.329966667,
    longitude: -121.711333333,
    partner: 'Timberline Ski Area',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth_24h',
      'snow_depth',
    ],
  },
  {
    stid: '45',
    name: 'Timberline - Magic Mile',
    elevation: 6990.0,
    latitude: 45.345366667,
    longitude: -121.71175,
    partner: 'Timberline Ski Area',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
    ],
  },
  {
    stid: '46',
    name: 'Skibowl Base',
    elevation: 3660.0,
    latitude: 45.301633333,
    longitude: -121.772133333,
    partner: 'Mt. Hood Skibowl',
    tableVariables: ['air_temp', 'relative_humidity', 'precip_accum_one_hour'],
  },
  {
    stid: '47',
    name: 'Skibowl Summit',
    elevation: 5010.0,
    latitude: 45.288566667,
    longitude: -121.78275,
    partner: 'Mt. Hood Skibowl',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
      'snow_depth',
    ],
  },
  {
    stid: '48',
    name: 'Blewett Pass',
    elevation: 4100.0,
    latitude: 47.334755,
    longitude: -120.577435,
    partner: 'WSDOT',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth_24h',
      'snow_depth',
      'pressure',
      'equip_temperature',
    ],
  },
  {
    stid: '49',
    name: 'White Pass - Pigtail Peak',
    elevation: 5970.0,
    latitude: 46.624,
    longitude: -121.388,
    partner: 'White Pass Ski Area',
    tableVariables: ['wind_speed_min', 'wind_speed', 'wind_gust', 'wind_direction'],
  },
  {
    stid: '50',
    name: 'Stevens Pass - Brooks Precipitation',
    elevation: 4800.0,
    latitude: 47.737577,
    longitude: -121.107316,
    partner: 'Stevens Pass Ski Area',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth_24h',
      'snow_depth',
    ],
  },
  {
    stid: '51',
    name: 'Stevens Pass - Old Faithful',
    elevation: 4590.0,
    latitude: 47.742,
    longitude: -121.117,
    partner: 'WSDOT',
    tableVariables: ['wind_speed_min', 'wind_speed', 'wind_gust', 'wind_direction'],
  },
  {
    stid: '53',
    name: 'Leavenworth',
    elevation: 1190.0,
    latitude: 47.591185,
    longitude: -120.671318,
    partner: 'WSDOT',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'precip_accum_one_hour',
      'snow_depth_24h',
      'snow_depth',
    ],
  },
  {
    stid: '54',
    name: 'Crystal - Campbell Basin',
    elevation: 5940.0,
    latitude: 46.92534,
    longitude: -121.49732,
    partner: 'Crystal Mt. Ski Area',
    tableVariables: ['air_temp', 'snow_depth_24h', 'snow_depth'],
  },
  {
    stid: '56',
    name: 'Timberline - Pucci',
    elevation: 5920.0,
    latitude: 45.33073,
    longitude: -121.71249,
    partner: 'Timberline Ski Area',
    tableVariables: ['wind_speed_min', 'wind_speed', 'wind_gust', 'wind_direction'],
  },
  {
    stid: '57',
    name: 'White Chuck Mountain',
    elevation: 5030.0,
    latitude: 48.22067,
    longitude: -121.44057,
    partner: 'NWAC',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
      'snow_depth',
      'solar_radiation',
    ],
  },
  {
    stid: '59',
    name: 'Newhalem',
    elevation: 3430.0,
    latitude: 48.68561,
    longitude: -121.25236,
    partner: 'WSDOT',
    tableVariables: [
      'air_temp',
      'relative_humidity',
      'wind_speed_min',
      'wind_speed',
      'wind_gust',
      'wind_direction',
      'snow_depth',
    ],
  },
  {
    stid: '245',
    name: 'Mission Ridge Base - 5 minute',
    elevation: 4610.0,
    latitude: 47.29125,
    longitude: -120.399383333,
    partner: null,
    tableVariables: [],
  },
  {
    stid: '255',
    name: 'Mission Ridge Summit - 5 minute',
    elevation: 6730.0,
    latitude: 47.27495,
    longitude: -120.427416667,
    partner: null,
    tableVariables: [],
  },
  {
    stid: '265',
    name: 'Mission Ridge Mid-Mountain - 5 minute',
    elevation: 5160.0,
    latitude: 47.285983333,
    longitude: -120.410816667,
    partner: null,
    tableVariables: [],
  },
  {
    stid: '415',
    name: 'Mt. Hood Meadows - Cascade Express - 5 minute',
    elevation: 7300.0,
    latitude: 45.349266667,
    longitude: -121.681633333,
    partner: null,
    tableVariables: [],
  },
  {
    stid: '425',
    name: 'Mt. Hood Meadows - Blue - 5 minute',
    elevation: 6540.0,
    latitude: 45.343566667,
    longitude: -121.672266667,
    partner: null,
    tableVariables: [],
  },
  {
    stid: '435',
    name: 'Mt. Hood Meadows Base - 5 minute',
    elevation: 5380.0,
    latitude: 45.332633333,
    longitude: -121.666033333,
    partner: null,
    tableVariables: [],
  },
]

type SeedGroup = {
  slug: string
  legacySlug: string
  displayName: string
  regionSlug: string
  stids: string[]
  archived: boolean
}

const GROUPS: SeedGroup[] = [
  {
    slug: 'hurricane-ridge',
    legacySlug: 'hurricaneridge',
    displayName: 'Hurricane Ridge',
    regionSlug: 'olympics',
    stids: ['4'],
    archived: false,
  },
  {
    slug: 'mt-baker-ski-area',
    legacySlug: 'mtbakerskiarea',
    displayName: 'Mt. Baker Ski Area',
    regionSlug: 'mt-baker',
    stids: ['6', '5'],
    archived: false,
  },
  {
    slug: 'newhalem',
    legacySlug: 'newhalem',
    displayName: 'Newhalem',
    regionSlug: 'sr20-west',
    stids: ['59'],
    archived: false,
  },
  {
    slug: 'white-chuck',
    legacySlug: 'whitechuck',
    displayName: 'White Chuck',
    regionSlug: 'mountain-loop',
    stids: ['57'],
    archived: false,
  },
  {
    slug: 'berne',
    legacySlug: 'bernemaintenancestation',
    displayName: 'Berne',
    regionSlug: 'stevens-pass',
    stids: ['12'],
    archived: false,
  },
  {
    slug: 'stevens-pass-schmidt-haus',
    legacySlug: 'stevenshwy2',
    displayName: 'Stevens Pass - WSDOT Schmidt Haus',
    regionSlug: 'stevens-pass',
    stids: ['13'],
    archived: false,
  },
  {
    slug: 'stevens-pass-brooks',
    legacySlug: 'brookssnow',
    displayName: 'Stevens Pass Ski Area - Brooks Chair',
    regionSlug: 'stevens-pass',
    stids: ['50'],
    archived: false,
  },
  {
    slug: 'grace-lakes',
    legacySlug: 'gracelakes',
    displayName: 'Grace Lakes & Old Faithful',
    regionSlug: 'stevens-pass',
    stids: ['14', '51'],
    archived: false,
  },
  {
    slug: 'stevens-ski-area',
    legacySlug: 'stevensskiarea',
    displayName: 'Stevens Pass Ski Area - Tye Mill Chair, Skyline Chair',
    regionSlug: 'stevens-pass',
    stids: ['18', '17'],
    archived: false,
  },
  {
    slug: 'alpental',
    legacySlug: 'alpental',
    displayName: 'Alpental Ski Area',
    regionSlug: 'snoqualmie-pass',
    stids: ['3', '2', '1'],
    archived: false,
  },
  {
    slug: 'mt-washington',
    legacySlug: 'mtwashington',
    displayName: 'Mt. Washington',
    regionSlug: 'snoqualmie-pass',
    stids: ['20'],
    archived: false,
  },
  {
    slug: 'snoqualmie-pass',
    legacySlug: 'snoqualmiepass',
    displayName: 'Snoqualmie Pass',
    regionSlug: 'snoqualmie-pass',
    stids: ['22', '23', '21'],
    archived: false,
  },
  {
    slug: 'crystal-mt-ski-area',
    legacySlug: 'crystalskiarea',
    displayName: 'Crystal Mt. Ski Area',
    regionSlug: 'crystal-mt',
    stids: ['29', '28'],
    archived: false,
  },
  {
    slug: 'crystal-mt-green-valley',
    legacySlug: 'crystalgrnvalley',
    displayName: 'Crystal Mt. - Green Valley & Campbell Basin',
    regionSlug: 'crystal-mt',
    stids: ['27', '54'],
    archived: false,
  },
  {
    slug: 'camp-muir',
    legacySlug: 'campmuir',
    displayName: 'Camp Muir',
    regionSlug: 'mt-rainier',
    stids: ['34'],
    archived: false,
  },
  {
    slug: 'paradise',
    legacySlug: 'paradise',
    displayName: 'Paradise',
    regionSlug: 'mt-rainier',
    stids: ['35', '36'],
    archived: false,
  },
  {
    slug: 'sunrise',
    legacySlug: 'sunrise',
    displayName: 'Sunrise',
    regionSlug: 'mt-rainier',
    stids: ['30', '31'],
    archived: false,
  },
  {
    slug: 'chinook-pass',
    legacySlug: 'chinookpass',
    displayName: 'Chinook Pass',
    regionSlug: 'chinook-pass',
    stids: ['32', '33'],
    archived: false,
  },
  {
    slug: 'white-pass',
    legacySlug: 'whitepass',
    displayName: 'White Pass Ski Area',
    regionSlug: 'white-pass',
    stids: ['39', '37', '49'],
    archived: false,
  },
  {
    slug: 'mt-st-helens',
    legacySlug: 'mtsthelens',
    displayName: 'Mt. St. Helens',
    regionSlug: 'mt-st-helens',
    stids: ['40'],
    archived: true,
  },
  {
    slug: 'mazama',
    legacySlug: 'mazama',
    displayName: 'Mazama',
    regionSlug: 'washington-pass',
    stids: ['7'],
    archived: false,
  },
  {
    slug: 'washington-pass',
    legacySlug: 'washingtonpass',
    displayName: 'Washington Pass',
    regionSlug: 'washington-pass',
    stids: ['9', '8'],
    archived: false,
  },
  {
    slug: 'blewett-pass',
    legacySlug: 'blewettpass',
    displayName: 'Blewett Pass',
    regionSlug: 'lake-wenatchee-to-mission-ridge',
    stids: ['48'],
    archived: false,
  },
  {
    slug: 'dirtyface-mtn',
    legacySlug: 'dirtyfacemtn',
    displayName: 'Dirtyface Mt',
    regionSlug: 'lake-wenatchee-to-mission-ridge',
    stids: ['10'],
    archived: false,
  },
  {
    slug: 'lake-wenatchee',
    legacySlug: 'lakewenatchee',
    displayName: 'Lake Wenatchee',
    regionSlug: 'lake-wenatchee-to-mission-ridge',
    stids: ['11'],
    archived: false,
  },
  {
    slug: 'mission-ridge',
    legacySlug: 'missionridge',
    displayName: 'Mission Ridge Ski Area',
    regionSlug: 'lake-wenatchee-to-mission-ridge',
    stids: ['25', '26', '24'],
    archived: false,
  },
  {
    slug: 'tumwater',
    legacySlug: 'tumwater',
    displayName: 'Tumwater Mt. & Leavenworth',
    regionSlug: 'lake-wenatchee-to-mission-ridge',
    stids: ['19', '53'],
    archived: false,
  },
  {
    slug: 'mt-hood-meadows',
    legacySlug: 'mthoodmeadows',
    displayName: 'Mt. Hood Meadows Ski Area',
    regionSlug: 'mt-hood',
    stids: ['42', '43'],
    archived: false,
  },
  {
    slug: 'cascade-express',
    legacySlug: 'cascade_express',
    displayName: 'Mt. Hood Meadows - Cascade Express',
    regionSlug: 'mt-hood',
    stids: ['41'],
    archived: false,
  },
  {
    slug: 'timberline-base',
    legacySlug: 'timberlinebase',
    displayName: 'Timberline Lodge',
    regionSlug: 'mt-hood',
    stids: ['44', '56'],
    archived: false,
  },
  {
    slug: 'timberline-upper',
    legacySlug: 'timberlineupper',
    displayName: 'Timberline - Magic Mile Chair',
    regionSlug: 'mt-hood',
    stids: ['45'],
    archived: false,
  },
  {
    slug: 'skibowl-ski-area',
    legacySlug: 'skibowlgovtcamp',
    displayName: 'Skibowl Ski Area - Government Camp',
    regionSlug: 'mt-hood',
    stids: ['47', '46'],
    archived: false,
  },
]

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`station_groups\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`tenant_id\` integer NOT NULL,
  	\`display_name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`legacy_slug\` text,
  	\`region_id\` integer NOT NULL,
  	\`archived\` integer DEFAULT false,
  	\`content_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`region_id\`) REFERENCES \`station_regions\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`CREATE INDEX \`station_groups_tenant_idx\` ON \`station_groups\` (\`tenant_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`station_groups_slug_idx\` ON \`station_groups\` (\`slug\`);`)
  await db.run(
    sql`CREATE INDEX \`station_groups_region_idx\` ON \`station_groups\` (\`region_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`station_groups_updated_at_idx\` ON \`station_groups\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`station_groups_created_at_idx\` ON \`station_groups\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`station_groups_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`stations_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`station_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`stations_id\`) REFERENCES \`stations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`station_groups_rels_order_idx\` ON \`station_groups_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`station_groups_rels_parent_idx\` ON \`station_groups_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`station_groups_rels_path_idx\` ON \`station_groups_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`station_groups_rels_stations_id_idx\` ON \`station_groups_rels\` (\`stations_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`station_regions\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`tenant_id\` integer NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`rank\` numeric NOT NULL,
  	\`content_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`CREATE INDEX \`station_regions_tenant_idx\` ON \`station_regions\` (\`tenant_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`station_regions_slug_idx\` ON \`station_regions\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`station_regions_rank_idx\` ON \`station_regions\` (\`rank\`);`)
  await db.run(
    sql`CREATE INDEX \`station_regions_updated_at_idx\` ON \`station_regions\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`station_regions_created_at_idx\` ON \`station_regions\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`stations_table_variables\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`stations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`stations_table_variables_order_idx\` ON \`stations_table_variables\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`stations_table_variables_parent_idx\` ON \`stations_table_variables\` (\`parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`stations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`tenant_id\` integer NOT NULL,
  	\`stid\` text NOT NULL,
  	\`source\` text NOT NULL,
  	\`name\` text,
  	\`elevation\` numeric,
  	\`latitude\` numeric,
  	\`longitude\` numeric,
  	\`weather_station_partner\` text,
  	\`last_synced_at\` text,
  	\`content_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`stations_tenant_idx\` ON \`stations\` (\`tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`stations_stid_idx\` ON \`stations\` (\`stid\`);`)
  await db.run(sql`CREATE INDEX \`stations_source_idx\` ON \`stations\` (\`source\`);`)
  await db.run(sql`CREATE INDEX \`stations_updated_at_idx\` ON \`stations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`stations_created_at_idx\` ON \`stations\` (\`created_at\`);`)
  await db.run(
    sql`ALTER TABLE \`settings\` ADD \`snowobs_weather_pages_enabled\` integer DEFAULT false;`,
  )
  await db.run(sql`ALTER TABLE \`settings\` ADD \`snowobs_alerts_enabled\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`settings\` ADD \`snowobs_source\` text;`)
  await db.run(sql`ALTER TABLE \`settings\` ADD \`snowobs_token\` text;`)
  await db.run(
    sql`ALTER TABLE \`settings\` ADD \`snowobs_display_timezone\` text DEFAULT 'America/Los_Angeles';`,
  )
  await db.run(
    sql`ALTER TABLE \`settings\` ADD \`snowobs_max_compare_stations\` numeric DEFAULT 3;`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`station_groups_id\` integer REFERENCES station_groups(id);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`station_regions_id\` integer REFERENCES station_regions(id);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`stations_id\` integer REFERENCES stations(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_station_groups_id_idx\` ON \`payload_locked_documents_rels\` (\`station_groups_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_station_regions_id_idx\` ON \`payload_locked_documents_rels\` (\`station_regions_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_stations_id_idx\` ON \`payload_locked_documents_rels\` (\`stations_id\`);`,
  )
  // ---- data ----------------------------------------------------------------

  const { docs: tenants } = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: TENANT_SLUG } },
    limit: 1,
    req,
  })
  const tenant = tenants[0]
  if (!tenant) {
    payload.logger.warn(`Tenant ${TENANT_SLUG} not found; weather station data not seeded.`)
    return
  }

  const regionIdBySlug = new Map<string, number>()
  for (const region of REGIONS) {
    const doc = await payload.create({
      collection: 'stationRegions',
      data: { ...region, tenant: tenant.id },
      req,
    })
    regionIdBySlug.set(region.slug, doc.id)
  }

  const stationIdByStid = new Map<string, number>()
  for (const station of STATIONS) {
    const doc = await payload.create({
      collection: 'stations',
      data: {
        stid: station.stid,
        source: SOURCE,
        name: station.name,
        elevation: station.elevation,
        latitude: station.latitude,
        longitude: station.longitude,
        weatherStationPartner: station.partner,
        tableVariables: station.tableVariables,
        tenant: tenant.id,
      },
      req,
    })
    stationIdByStid.set(station.stid, doc.id)
  }

  for (const group of GROUPS) {
    const region = regionIdBySlug.get(group.regionSlug)
    if (!region) throw new Error(`Region ${group.regionSlug} missing for group ${group.slug}`)

    // Order matters: it is what interleaves each station's columns.
    const stations = group.stids.map((stid) => {
      const id = stationIdByStid.get(stid)
      if (!id) throw new Error(`Station ${stid} missing for group ${group.slug}`)
      return id
    })

    await payload.create({
      collection: 'stationGroups',
      data: {
        slug: group.slug,
        legacySlug: group.legacySlug,
        displayName: group.displayName,
        archived: group.archived,
        region,
        stations,
        tenant: tenant.id,
      },
      req,
    })
  }

  payload.logger.info(
    `Seeded ${REGIONS.length} regions, ${STATIONS.length} stations and ${GROUPS.length} station groups.`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`station_groups\`;`)
  await db.run(sql`DROP TABLE \`station_groups_rels\`;`)
  await db.run(sql`DROP TABLE \`station_regions\`;`)
  await db.run(sql`DROP TABLE \`stations_table_variables\`;`)
  await db.run(sql`DROP TABLE \`stations\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`home_pages_id\` integer,
  	\`built_in_pages_id\` integer,
  	\`pages_id\` integer,
  	\`posts_id\` integer,
  	\`media_id\` integer,
  	\`galleries_id\` integer,
  	\`documents_id\` integer,
  	\`announcements_id\` integer,
  	\`sponsors_id\` integer,
  	\`tags_id\` integer,
  	\`events_id\` integer,
  	\`event_groups_id\` integer,
  	\`event_tags_id\` integer,
  	\`providers_id\` integer,
  	\`courses_id\` integer,
  	\`biographies_id\` integer,
  	\`teams_id\` integer,
  	\`users_id\` integer,
  	\`roles_id\` integer,
  	\`role_assignments_id\` integer,
  	\`global_roles_id\` integer,
  	\`global_role_assignments_id\` integer,
  	\`tenants_id\` integer,
  	\`navigations_id\` integer,
  	\`settings_id\` integer,
  	\`redirects_id\` integer,
  	\`forms_id\` integer,
  	\`form_submissions_id\` integer,
  	\`payload_mcp_api_keys_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`home_pages_id\`) REFERENCES \`home_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`built_in_pages_id\`) REFERENCES \`built_in_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`galleries_id\`) REFERENCES \`galleries\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`documents_id\`) REFERENCES \`documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`announcements_id\`) REFERENCES \`announcements\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sponsors_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`events_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`event_groups_id\`) REFERENCES \`event_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`event_tags_id\`) REFERENCES \`event_tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`providers_id\`) REFERENCES \`providers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`courses_id\`) REFERENCES \`courses\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`biographies_id\`) REFERENCES \`biographies\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`teams_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`roles_id\`) REFERENCES \`roles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`role_assignments_id\`) REFERENCES \`role_assignments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`global_roles_id\`) REFERENCES \`global_roles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`global_role_assignments_id\`) REFERENCES \`global_role_assignments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tenants_id\`) REFERENCES \`tenants\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`navigations_id\`) REFERENCES \`navigations\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`settings_id\`) REFERENCES \`settings\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`redirects_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`forms_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`payload_mcp_api_keys_id\`) REFERENCES \`payload_mcp_api_keys\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "home_pages_id", "built_in_pages_id", "pages_id", "posts_id", "media_id", "galleries_id", "documents_id", "announcements_id", "sponsors_id", "tags_id", "events_id", "event_groups_id", "event_tags_id", "providers_id", "courses_id", "biographies_id", "teams_id", "users_id", "roles_id", "role_assignments_id", "global_roles_id", "global_role_assignments_id", "tenants_id", "navigations_id", "settings_id", "redirects_id", "forms_id", "form_submissions_id", "payload_mcp_api_keys_id") SELECT "id", "order", "parent_id", "path", "home_pages_id", "built_in_pages_id", "pages_id", "posts_id", "media_id", "galleries_id", "documents_id", "announcements_id", "sponsors_id", "tags_id", "events_id", "event_groups_id", "event_tags_id", "providers_id", "courses_id", "biographies_id", "teams_id", "users_id", "roles_id", "role_assignments_id", "global_roles_id", "global_role_assignments_id", "tenants_id", "navigations_id", "settings_id", "redirects_id", "forms_id", "form_submissions_id", "payload_mcp_api_keys_id" FROM \`payload_locked_documents_rels\`;`,
  )
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(
    sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`,
  )
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_home_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`home_pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_built_in_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`built_in_pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_galleries_id_idx\` ON \`payload_locked_documents_rels\` (\`galleries_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_documents_id_idx\` ON \`payload_locked_documents_rels\` (\`documents_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_announcements_id_idx\` ON \`payload_locked_documents_rels\` (\`announcements_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_sponsors_id_idx\` ON \`payload_locked_documents_rels\` (\`sponsors_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_tags_id_idx\` ON \`payload_locked_documents_rels\` (\`tags_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_events_id_idx\` ON \`payload_locked_documents_rels\` (\`events_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_event_groups_id_idx\` ON \`payload_locked_documents_rels\` (\`event_groups_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_event_tags_id_idx\` ON \`payload_locked_documents_rels\` (\`event_tags_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_providers_id_idx\` ON \`payload_locked_documents_rels\` (\`providers_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_courses_id_idx\` ON \`payload_locked_documents_rels\` (\`courses_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_biographies_id_idx\` ON \`payload_locked_documents_rels\` (\`biographies_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_teams_id_idx\` ON \`payload_locked_documents_rels\` (\`teams_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_roles_id_idx\` ON \`payload_locked_documents_rels\` (\`roles_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_role_assignments_id_idx\` ON \`payload_locked_documents_rels\` (\`role_assignments_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_global_roles_id_idx\` ON \`payload_locked_documents_rels\` (\`global_roles_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_global_role_assignments_id_idx\` ON \`payload_locked_documents_rels\` (\`global_role_assignments_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_tenants_id_idx\` ON \`payload_locked_documents_rels\` (\`tenants_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_navigations_id_idx\` ON \`payload_locked_documents_rels\` (\`navigations_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_settings_id_idx\` ON \`payload_locked_documents_rels\` (\`settings_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_redirects_id_idx\` ON \`payload_locked_documents_rels\` (\`redirects_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_forms_id_idx\` ON \`payload_locked_documents_rels\` (\`forms_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_payload_mcp_api_keys_id_idx\` ON \`payload_locked_documents_rels\` (\`payload_mcp_api_keys_id\`);`,
  )
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`snowobs_weather_pages_enabled\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`snowobs_alerts_enabled\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`snowobs_source\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`snowobs_token\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`snowobs_display_timezone\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`snowobs_max_compare_stations\`;`)
}
