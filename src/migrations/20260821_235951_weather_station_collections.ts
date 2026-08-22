/**
 * Weather station collections, plus the registry they replace.
 *
 * Seeds the 14 index regions, the 60 SnowObs stations and the 32 pages that
 * currently live in `src/constants/weatherStations.ts`, so the data is in place
 * before anything reads it. The station rows are a point-in-time snapshot; the
 * hourly sync corrects anything stale on its first run.
 *
 * Each page carries its own column rows -- one reading, and the loggers
 * reporting it -- in the order the legacy tables used. That reproduces 30 of
 * the 32 layouts exactly; Alpental and Crystal Green Valley keep the same
 * columns in a slightly different order, because both interleaved a pair of
 * snow readings per station in a way one row per reading cannot express.
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
}

const STATIONS: SeedStation[] = [
  {
    stid: '1',
    name: 'Alpental Base',
    elevation: 3100,
    latitude: 47.444066667,
    longitude: -121.42485,
    partner: 'Alpental Ski Area',
  },
  {
    stid: '2',
    name: 'Alpental Mid-Mountain',
    elevation: 4350,
    latitude: 47.4347404,
    longitude: -121.433565,
    partner: 'Alpental Ski Area',
  },
  {
    stid: '3',
    name: 'Alpental Summit',
    elevation: 5470,
    latitude: 47.438816667,
    longitude: -121.442616667,
    partner: 'Alpental Ski Area',
  },
  {
    stid: '4',
    name: 'Hurricane Ridge',
    elevation: 5250,
    latitude: 47.9704,
    longitude: -123.499333333,
    partner: 'Olympic National Park',
  },
  {
    stid: '5',
    name: 'Mt. Baker - Heather Meadows',
    elevation: 4210,
    latitude: 48.863016667,
    longitude: -121.67785,
    partner: 'Mt. Baker Ski Area',
  },
  {
    stid: '6',
    name: 'Mt. Baker - Pan Dome',
    elevation: 5020,
    latitude: 48.85305,
    longitude: -121.6772,
    partner: 'Mt. Baker Ski Area',
  },
  {
    stid: '7',
    name: 'Mazama',
    elevation: 2170,
    latitude: 48.597283333,
    longitude: -120.437433333,
    partner: 'Freestone Inn',
  },
  {
    stid: '8',
    name: 'Washington Pass Base',
    elevation: 5450,
    latitude: 48.525783333,
    longitude: -120.65525,
    partner: 'WSDOT',
  },
  {
    stid: '9',
    name: 'Washington Pass Upper',
    elevation: 6680,
    latitude: 48.533283333,
    longitude: -120.649733333,
    partner: 'WSDOT',
  },
  {
    stid: '10',
    name: 'Dirtyface Summit',
    elevation: 5980,
    latitude: 47.855716667,
    longitude: -120.7993,
    partner: 'USFS',
  },
  {
    stid: '11',
    name: 'Lake Wenatchee',
    elevation: 1930,
    latitude: 47.813516667,
    longitude: -120.722916667,
    partner: 'WA State Parks & Rec',
  },
  {
    stid: '12',
    name: 'Berne',
    elevation: 2700,
    latitude: 47.775016667,
    longitude: -120.965983333,
    partner: 'WSDOT',
  },
  {
    stid: '13',
    name: 'Stevens Pass - Schmidt Haus',
    elevation: 3950,
    latitude: 47.746133333,
    longitude: -121.092633333,
    partner: 'WSDOT',
  },
  {
    stid: '14',
    name: 'Stevens Pass - Grace Lakes',
    elevation: 4790,
    latitude: 47.74085,
    longitude: -121.117083333,
    partner: 'WSDOT',
  },
  {
    stid: '15',
    name: 'Stevens Pass - Brooks Wind (Retired 2019)',
    elevation: 4850,
    latitude: 47.73815,
    longitude: -121.106616667,
    partner: 'Stevens Pass Ski Area',
  },
  {
    stid: '17',
    name: 'Stevens Pass - Skyline',
    elevation: 5250,
    latitude: 47.734,
    longitude: -121.1081,
    partner: 'Stevens Pass Ski Area',
  },
  {
    stid: '18',
    name: 'Stevens Pass - Tye Mill',
    elevation: 5180,
    latitude: 47.731633333,
    longitude: -121.0853,
    partner: 'Stevens Pass Ski Area',
  },
  {
    stid: '19',
    name: 'Tumwater Mountain',
    elevation: 4180,
    latitude: 47.628333333,
    longitude: -120.707166667,
    partner: 'WSDOT',
  },
  {
    stid: '20',
    name: 'Mt. Washington',
    elevation: 4340,
    latitude: 47.425933333,
    longitude: -121.699383333,
    partner: 'WSDOT',
  },
  {
    stid: '21',
    name: 'Snoqualmie Pass',
    elevation: 3010,
    latitude: 47.424866667,
    longitude: -121.41395,
    partner: 'WSDOT',
  },
  {
    stid: '22',
    name: 'Snoqualmie Pass - Dodge Ridge',
    elevation: 3760,
    latitude: 47.4204,
    longitude: -121.427533333,
    partner: 'WSDOT',
  },
  {
    stid: '23',
    name: 'Snoqualmie Pass - East Shed',
    elevation: 3770,
    latitude: 47.357233333,
    longitude: -121.360333333,
    partner: 'WSDOT',
  },
  {
    stid: '24',
    name: 'Mission Ridge Base',
    elevation: 4610,
    latitude: 47.29125,
    longitude: -120.399383333,
    partner: 'Mission Ridge Ski Area',
  },
  {
    stid: '25',
    name: 'Mission Ridge Summit',
    elevation: 6730,
    latitude: 47.27495,
    longitude: -120.427416667,
    partner: 'Mission Ridge Ski Area',
  },
  {
    stid: '26',
    name: 'Mission Ridge Mid-Mountain',
    elevation: 5160,
    latitude: 47.285983333,
    longitude: -120.410816667,
    partner: 'Mission Ridge Ski Area',
  },
  {
    stid: '27',
    name: 'Crystal - Green Valley',
    elevation: 6230,
    latitude: 46.939433333,
    longitude: -121.494333333,
    partner: 'Crystal Mt. Ski Area',
  },
  {
    stid: '28',
    name: 'Crystal Base',
    elevation: 4540,
    latitude: 46.9305,
    longitude: -121.47578,
    partner: 'Crystal Mt. Ski Area',
  },
  {
    stid: '29',
    name: 'Crystal Summit',
    elevation: 6830,
    latitude: 46.93505,
    longitude: -121.500433333,
    partner: 'Crystal Mt. Ski Area',
  },
  {
    stid: '30',
    name: 'Sunrise Upper',
    elevation: 6880,
    latitude: 46.919183333,
    longitude: -121.6516,
    partner: 'Mt. Rainier National Park',
  },
  {
    stid: '31',
    name: 'Sunrise Base',
    elevation: 6410,
    latitude: 46.914366667,
    longitude: -121.644166667,
    partner: 'Mt. Rainier National Park',
  },
  {
    stid: '32',
    name: 'Chinook Pass Summit',
    elevation: 6240,
    latitude: 46.880533333,
    longitude: -121.519566667,
    partner: 'WSDOT',
  },
  {
    stid: '33',
    name: 'Chinook Pass Base',
    elevation: 5500,
    latitude: 46.873266667,
    longitude: -121.517383333,
    partner: 'WSDOT',
  },
  {
    stid: '34',
    name: 'Camp Muir',
    elevation: 10110,
    latitude: 46.835416667,
    longitude: -121.73305,
    partner: 'Mt. Rainier National Park',
  },
  {
    stid: '35',
    name: 'Paradise',
    elevation: 5400,
    latitude: 46.786216667,
    longitude: -121.7424,
    partner: 'Mt. Rainier National Park',
  },
  {
    stid: '36',
    name: 'Paradise Wind',
    elevation: 5380,
    latitude: 46.784866667,
    longitude: -121.7419,
    partner: 'Mt. Rainier National Park',
  },
  {
    stid: '37',
    name: 'White Pass Base',
    elevation: 4500,
    latitude: 46.63678,
    longitude: -121.3915,
    partner: 'White Pass Ski Area',
  },
  {
    stid: '39',
    name: 'White Pass Upper',
    elevation: 5800,
    latitude: 46.620766667,
    longitude: -121.387366667,
    partner: 'White Pass Ski Area',
  },
  {
    stid: '40',
    name: 'Mt. St. Helens - Coldwater',
    elevation: 3260,
    latitude: 46.303333333,
    longitude: -122.265033333,
    partner: 'USFS',
  },
  {
    stid: '41',
    name: 'Mt. Hood Meadows - Cascade Express',
    elevation: 7300,
    latitude: 45.349266667,
    longitude: -121.681633333,
    partner: 'Mt. Hood Meadows Ski Area',
  },
  {
    stid: '42',
    name: 'Mt. Hood Meadows - Blue',
    elevation: 6540,
    latitude: 45.343566667,
    longitude: -121.672266667,
    partner: 'Mt. Hood Meadows Ski Area',
  },
  {
    stid: '43',
    name: 'Mt. Hood Meadows Base',
    elevation: 5380,
    latitude: 45.332633333,
    longitude: -121.666033333,
    partner: 'Mt. Hood Meadows Ski Area',
  },
  {
    stid: '44',
    name: 'Timberline Lodge',
    elevation: 5800,
    latitude: 45.329966667,
    longitude: -121.711333333,
    partner: 'Timberline Ski Area',
  },
  {
    stid: '45',
    name: 'Timberline - Magic Mile',
    elevation: 6990,
    latitude: 45.345366667,
    longitude: -121.71175,
    partner: 'Timberline Ski Area',
  },
  {
    stid: '46',
    name: 'Skibowl Base',
    elevation: 3660,
    latitude: 45.301633333,
    longitude: -121.772133333,
    partner: 'Mt. Hood Skibowl',
  },
  {
    stid: '47',
    name: 'Skibowl Summit',
    elevation: 5010,
    latitude: 45.288566667,
    longitude: -121.78275,
    partner: 'Mt. Hood Skibowl',
  },
  {
    stid: '48',
    name: 'Blewett Pass',
    elevation: 4100,
    latitude: 47.334755,
    longitude: -120.577435,
    partner: 'WSDOT',
  },
  {
    stid: '49',
    name: 'White Pass - Pigtail Peak',
    elevation: 5970,
    latitude: 46.624,
    longitude: -121.388,
    partner: 'White Pass Ski Area',
  },
  {
    stid: '50',
    name: 'Stevens Pass - Brooks Precipitation',
    elevation: 4800,
    latitude: 47.737577,
    longitude: -121.107316,
    partner: 'Stevens Pass Ski Area',
  },
  {
    stid: '51',
    name: 'Stevens Pass - Old Faithful',
    elevation: 4590,
    latitude: 47.742,
    longitude: -121.117,
    partner: 'WSDOT',
  },
  {
    stid: '53',
    name: 'Leavenworth',
    elevation: 1190,
    latitude: 47.591185,
    longitude: -120.671318,
    partner: 'WSDOT',
  },
  {
    stid: '54',
    name: 'Crystal - Campbell Basin',
    elevation: 5940,
    latitude: 46.92534,
    longitude: -121.49732,
    partner: 'Crystal Mt. Ski Area',
  },
  {
    stid: '56',
    name: 'Timberline - Pucci',
    elevation: 5920,
    latitude: 45.33073,
    longitude: -121.71249,
    partner: 'Timberline Ski Area',
  },
  {
    stid: '57',
    name: 'White Chuck Mountain',
    elevation: 5030,
    latitude: 48.22067,
    longitude: -121.44057,
    partner: 'NWAC',
  },
  {
    stid: '59',
    name: 'Newhalem',
    elevation: 3430,
    latitude: 48.68561,
    longitude: -121.25236,
    partner: 'WSDOT',
  },
  {
    stid: '245',
    name: 'Mission Ridge Base - 5 minute',
    elevation: 4610,
    latitude: 47.29125,
    longitude: -120.399383333,
    partner: null,
  },
  {
    stid: '255',
    name: 'Mission Ridge Summit - 5 minute',
    elevation: 6730,
    latitude: 47.27495,
    longitude: -120.427416667,
    partner: null,
  },
  {
    stid: '265',
    name: 'Mission Ridge Mid-Mountain - 5 minute',
    elevation: 5160,
    latitude: 47.285983333,
    longitude: -120.410816667,
    partner: null,
  },
  {
    stid: '415',
    name: 'Mt. Hood Meadows - Cascade Express - 5 minute',
    elevation: 7300,
    latitude: 45.349266667,
    longitude: -121.681633333,
    partner: null,
  },
  {
    stid: '425',
    name: 'Mt. Hood Meadows - Blue - 5 minute',
    elevation: 6540,
    latitude: 45.343566667,
    longitude: -121.672266667,
    partner: null,
  },
  {
    stid: '435',
    name: 'Mt. Hood Meadows Base - 5 minute',
    elevation: 5380,
    latitude: 45.332633333,
    longitude: -121.666033333,
    partner: null,
  },
]

type SeedGroup = {
  slug: string
  legacySlug: string | null
  displayName: string
  regionSlug: string
  stids: string[]
  archived: boolean
  columns: { variable: string; stids: string[] }[]
}

const GROUPS: SeedGroup[] = [
  {
    slug: 'hurricane-ridge',
    legacySlug: 'hurricaneridge',
    displayName: 'Hurricane Ridge',
    regionSlug: 'Olympics',
    archived: false,
    stids: ['4'],
    columns: [
      { variable: 'air_temp', stids: ['4'] },
      { variable: 'relative_humidity', stids: ['4'] },
      { variable: 'wind_speed_min', stids: ['4'] },
      { variable: 'wind_speed', stids: ['4'] },
      { variable: 'wind_gust', stids: ['4'] },
      { variable: 'wind_direction', stids: ['4'] },
      { variable: 'precip_accum_one_hour', stids: ['4'] },
      { variable: 'snow_depth', stids: ['4'] },
      { variable: 'solar_radiation', stids: ['4'] },
    ],
  },
  {
    slug: 'mt-baker-ski-area',
    legacySlug: 'mtbakerskiarea',
    displayName: 'Mt. Baker Ski Area',
    regionSlug: 'Mt Baker',
    archived: false,
    stids: ['6', '5'],
    columns: [
      { variable: 'air_temp', stids: ['6', '5'] },
      { variable: 'relative_humidity', stids: ['6', '5'] },
      { variable: 'wind_speed_min', stids: ['6'] },
      { variable: 'wind_speed', stids: ['6'] },
      { variable: 'wind_gust', stids: ['6'] },
      { variable: 'wind_direction', stids: ['6'] },
      { variable: 'precip_accum_one_hour', stids: ['5'] },
      { variable: 'snow_depth_24h', stids: ['5'] },
      { variable: 'snow_depth', stids: ['5'] },
      { variable: 'solar_radiation', stids: ['6'] },
    ],
  },
  {
    slug: 'newhalem',
    legacySlug: 'newhalem',
    displayName: 'Newhalem',
    regionSlug: 'SR20 West',
    archived: false,
    stids: ['59'],
    columns: [
      { variable: 'air_temp', stids: ['59'] },
      { variable: 'relative_humidity', stids: ['59'] },
      { variable: 'wind_speed_min', stids: ['59'] },
      { variable: 'wind_speed', stids: ['59'] },
      { variable: 'wind_gust', stids: ['59'] },
      { variable: 'wind_direction', stids: ['59'] },
      { variable: 'snow_depth', stids: ['59'] },
    ],
  },
  {
    slug: 'white-chuck',
    legacySlug: 'whitechuck',
    displayName: 'White Chuck',
    regionSlug: 'Mountain Loop',
    archived: false,
    stids: ['57'],
    columns: [
      { variable: 'air_temp', stids: ['57'] },
      { variable: 'relative_humidity', stids: ['57'] },
      { variable: 'wind_speed_min', stids: ['57'] },
      { variable: 'wind_speed', stids: ['57'] },
      { variable: 'wind_gust', stids: ['57'] },
      { variable: 'wind_direction', stids: ['57'] },
      { variable: 'snow_depth', stids: ['57'] },
      { variable: 'solar_radiation', stids: ['57'] },
    ],
  },
  {
    slug: 'berne',
    legacySlug: 'bernemaintenancestation',
    displayName: 'Berne',
    regionSlug: 'Stevens Pass',
    archived: false,
    stids: ['12'],
    columns: [
      { variable: 'air_temp', stids: ['12'] },
      { variable: 'relative_humidity', stids: ['12'] },
      { variable: 'precip_accum_one_hour', stids: ['12'] },
      { variable: 'snow_depth_24h', stids: ['12'] },
      { variable: 'snow_depth', stids: ['12'] },
      { variable: 'pressure', stids: ['12'] },
    ],
  },
  {
    slug: 'stevens-pass-schmidt-haus',
    legacySlug: 'stevenshwy2',
    displayName: 'Stevens Pass - WSDOT Schmidt Haus',
    regionSlug: 'Stevens Pass',
    archived: false,
    stids: ['13'],
    columns: [
      { variable: 'air_temp', stids: ['13'] },
      { variable: 'relative_humidity', stids: ['13'] },
      { variable: 'precip_accum_one_hour', stids: ['13'] },
      { variable: 'snow_depth_24h', stids: ['13'] },
      { variable: 'snow_depth', stids: ['13'] },
      { variable: 'pressure', stids: ['13'] },
    ],
  },
  {
    slug: 'stevens-pass-brooks',
    legacySlug: 'brookssnow',
    displayName: 'Stevens Pass Ski Area - Brooks Chair',
    regionSlug: 'Stevens Pass',
    archived: false,
    stids: ['50'],
    columns: [
      { variable: 'air_temp', stids: ['50'] },
      { variable: 'relative_humidity', stids: ['50'] },
      { variable: 'precip_accum_one_hour', stids: ['50'] },
      { variable: 'snow_depth_24h', stids: ['50'] },
      { variable: 'snow_depth', stids: ['50'] },
    ],
  },
  {
    slug: 'grace-lakes',
    legacySlug: 'gracelakes',
    displayName: 'Grace Lakes & Old Faithful',
    regionSlug: 'Stevens Pass',
    archived: false,
    stids: ['14', '51'],
    columns: [
      { variable: 'air_temp', stids: ['14'] },
      { variable: 'relative_humidity', stids: ['14'] },
      { variable: 'wind_speed_min', stids: ['51'] },
      { variable: 'wind_speed', stids: ['51'] },
      { variable: 'wind_gust', stids: ['51'] },
      { variable: 'wind_direction', stids: ['51'] },
      { variable: 'snow_depth', stids: ['14'] },
      { variable: 'intermittent_snow', stids: ['14'] },
    ],
  },
  {
    slug: 'stevens-ski-area',
    legacySlug: 'stevensskiarea',
    displayName: 'Stevens Pass Ski Area - Tye Mill Chair, Skyline Chair',
    regionSlug: 'Stevens Pass',
    archived: false,
    stids: ['18', '17'],
    columns: [
      { variable: 'air_temp', stids: ['18', '17'] },
      { variable: 'relative_humidity', stids: ['17'] },
      { variable: 'wind_speed_min', stids: ['18'] },
      { variable: 'wind_speed', stids: ['18'] },
      { variable: 'wind_gust', stids: ['18'] },
      { variable: 'wind_direction', stids: ['18'] },
    ],
  },
  {
    slug: 'alpental',
    legacySlug: 'alpental',
    displayName: 'Alpental Ski Area',
    regionSlug: 'Snoqualmie Pass',
    archived: false,
    stids: ['3', '2', '1'],
    columns: [
      { variable: 'air_temp', stids: ['3', '2', '1'] },
      { variable: 'relative_humidity', stids: ['3', '1'] },
      { variable: 'wind_speed', stids: ['3'] },
      { variable: 'wind_gust', stids: ['3'] },
      { variable: 'wind_direction', stids: ['3'] },
      { variable: 'precip_accum_one_hour', stids: ['1'] },
      { variable: 'snow_depth_24h', stids: ['1', '2'] },
      { variable: 'snow_depth', stids: ['1', '2'] },
      { variable: 'intermittent_snow', stids: ['3'] },
    ],
  },
  {
    slug: 'mt-washington',
    legacySlug: 'mtwashington',
    displayName: 'Mt. Washington',
    regionSlug: 'Snoqualmie Pass',
    archived: false,
    stids: ['20'],
    columns: [
      { variable: 'air_temp', stids: ['20'] },
      { variable: 'wind_direction', stids: ['20'] },
      { variable: 'relative_humidity', stids: ['20'] },
      { variable: 'solar_radiation', stids: ['20'] },
    ],
  },
  {
    slug: 'snoqualmie-pass',
    legacySlug: 'snoqualmiepass',
    displayName: 'Snoqualmie Pass',
    regionSlug: 'Snoqualmie Pass',
    archived: false,
    stids: ['22', '23', '21'],
    columns: [
      { variable: 'air_temp', stids: ['22', '23', '21'] },
      { variable: 'relative_humidity', stids: ['21'] },
      { variable: 'wind_speed_min', stids: ['22'] },
      { variable: 'wind_speed', stids: ['22'] },
      { variable: 'wind_gust', stids: ['22'] },
      { variable: 'wind_direction', stids: ['22'] },
      { variable: 'precip_accum_one_hour', stids: ['21'] },
      { variable: 'snow_depth_24h', stids: ['21'] },
      { variable: 'snow_depth', stids: ['21'] },
      { variable: 'pressure', stids: ['21'] },
    ],
  },
  {
    slug: 'crystal-mt-ski-area',
    legacySlug: 'crystalskiarea',
    displayName: 'Crystal Mt. Ski Area',
    regionSlug: 'Crystal Mt.',
    archived: false,
    stids: ['29', '28'],
    columns: [
      { variable: 'air_temp', stids: ['29', '28'] },
      { variable: 'relative_humidity', stids: ['29', '28'] },
      { variable: 'wind_speed_min', stids: ['29'] },
      { variable: 'wind_speed', stids: ['29'] },
      { variable: 'wind_gust', stids: ['29'] },
      { variable: 'wind_direction', stids: ['29'] },
      { variable: 'precip_accum_one_hour', stids: ['28'] },
      { variable: 'snow_depth_24h', stids: ['28'] },
      { variable: 'snow_depth', stids: ['28'] },
    ],
  },
  {
    slug: 'crystal-mt-green-valley',
    legacySlug: 'crystalgrnvalley',
    displayName: 'Crystal Mt. - Green Valley & Campbell Basin',
    regionSlug: 'Crystal Mt.',
    archived: false,
    stids: ['27', '54'],
    columns: [
      { variable: 'air_temp', stids: ['27', '54'] },
      { variable: 'relative_humidity', stids: ['27'] },
      { variable: 'snow_depth_24h', stids: ['27', '54'] },
      { variable: 'snow_depth', stids: ['27', '54'] },
    ],
  },
  {
    slug: 'camp-muir',
    legacySlug: 'campmuir',
    displayName: 'Camp Muir',
    regionSlug: 'Mt Rainier',
    archived: false,
    stids: ['34'],
    columns: [
      { variable: 'air_temp', stids: ['34'] },
      { variable: 'relative_humidity', stids: ['34'] },
      { variable: 'wind_speed_min', stids: ['34'] },
      { variable: 'wind_speed', stids: ['34'] },
      { variable: 'wind_gust', stids: ['34'] },
      { variable: 'wind_direction', stids: ['34'] },
      { variable: 'solar_radiation', stids: ['34'] },
    ],
  },
  {
    slug: 'paradise',
    legacySlug: 'paradise',
    displayName: 'Paradise',
    regionSlug: 'Mt Rainier',
    archived: false,
    stids: ['35', '36'],
    columns: [
      { variable: 'air_temp', stids: ['35'] },
      { variable: 'relative_humidity', stids: ['35'] },
      { variable: 'wind_speed_min', stids: ['36'] },
      { variable: 'wind_speed', stids: ['36'] },
      { variable: 'wind_gust', stids: ['36'] },
      { variable: 'wind_direction', stids: ['36'] },
      { variable: 'precip_accum_one_hour', stids: ['35'] },
      { variable: 'snow_depth_24h', stids: ['35'] },
      { variable: 'snow_depth', stids: ['35'] },
      { variable: 'solar_radiation', stids: ['36'] },
    ],
  },
  {
    slug: 'sunrise',
    legacySlug: 'sunrise',
    displayName: 'Sunrise',
    regionSlug: 'Mt Rainier',
    archived: false,
    stids: ['30', '31'],
    columns: [
      { variable: 'air_temp', stids: ['30', '31'] },
      { variable: 'relative_humidity', stids: ['30', '31'] },
      { variable: 'wind_speed_min', stids: ['30'] },
      { variable: 'wind_speed', stids: ['30'] },
      { variable: 'wind_gust', stids: ['30'] },
      { variable: 'wind_direction', stids: ['30'] },
      { variable: 'snow_depth', stids: ['31'] },
    ],
  },
  {
    slug: 'chinook-pass',
    legacySlug: 'chinookpass',
    displayName: 'Chinook Pass',
    regionSlug: 'Chinook Pass',
    archived: false,
    stids: ['32', '33'],
    columns: [
      { variable: 'air_temp', stids: ['32', '33'] },
      { variable: 'relative_humidity', stids: ['32', '33'] },
      { variable: 'wind_speed', stids: ['32'] },
      { variable: 'wind_gust', stids: ['32'] },
      { variable: 'wind_direction', stids: ['32'] },
      { variable: 'precip_accum_one_hour', stids: ['33'] },
      { variable: 'snow_depth', stids: ['33'] },
      { variable: 'equip_temperature', stids: ['33'] },
    ],
  },
  {
    slug: 'white-pass',
    legacySlug: 'whitepass',
    displayName: 'White Pass Ski Area',
    regionSlug: 'White Pass',
    archived: false,
    stids: ['39', '37', '49'],
    columns: [
      { variable: 'air_temp', stids: ['39', '37'] },
      { variable: 'relative_humidity', stids: ['39', '37'] },
      { variable: 'wind_speed_min', stids: ['49'] },
      { variable: 'wind_speed', stids: ['49'] },
      { variable: 'wind_gust', stids: ['49'] },
      { variable: 'wind_direction', stids: ['49'] },
      { variable: 'precip_accum_one_hour', stids: ['39'] },
      { variable: 'snow_depth_24h', stids: ['39'] },
      { variable: 'snow_depth', stids: ['39'] },
    ],
  },
  {
    slug: 'mt-st-helens',
    legacySlug: 'mtsthelens',
    displayName: 'Mt. St. Helens',
    regionSlug: 'Mt St Helens',
    archived: true,
    stids: ['40'],
    columns: [
      { variable: 'air_temp', stids: ['40'] },
      { variable: 'relative_humidity', stids: ['40'] },
      { variable: 'wind_speed_min', stids: ['40'] },
      { variable: 'wind_speed', stids: ['40'] },
      { variable: 'wind_gust', stids: ['40'] },
      { variable: 'wind_direction', stids: ['40'] },
      { variable: 'precip_accum_one_hour', stids: ['40'] },
    ],
  },
  {
    slug: 'mazama',
    legacySlug: 'mazama',
    displayName: 'Mazama',
    regionSlug: 'Washington Pass',
    archived: false,
    stids: ['7'],
    columns: [
      { variable: 'air_temp', stids: ['7'] },
      { variable: 'relative_humidity', stids: ['7'] },
      { variable: 'wind_speed', stids: ['7'] },
      { variable: 'wind_gust', stids: ['7'] },
      { variable: 'wind_direction', stids: ['7'] },
      { variable: 'precip_accum_one_hour', stids: ['7'] },
      { variable: 'snow_depth_24h', stids: ['7'] },
      { variable: 'snow_depth', stids: ['7'] },
      { variable: 'solar_radiation', stids: ['7'] },
    ],
  },
  {
    slug: 'washington-pass',
    legacySlug: 'washingtonpass',
    displayName: 'Washington Pass',
    regionSlug: 'Washington Pass',
    archived: false,
    stids: ['9', '8'],
    columns: [
      { variable: 'air_temp', stids: ['9', '8'] },
      { variable: 'relative_humidity', stids: ['9', '8'] },
      { variable: 'wind_speed_min', stids: ['9'] },
      { variable: 'wind_speed', stids: ['9'] },
      { variable: 'wind_gust', stids: ['9'] },
      { variable: 'wind_direction', stids: ['9'] },
      { variable: 'precip_accum_one_hour', stids: ['8'] },
      { variable: 'snow_depth', stids: ['8'] },
      { variable: 'equip_temperature', stids: ['8'] },
    ],
  },
  {
    slug: 'blewett-pass',
    legacySlug: 'blewettpass',
    displayName: 'Blewett Pass',
    regionSlug: 'Lake Wenatchee to Mission Ridge',
    archived: false,
    stids: ['48'],
    columns: [
      { variable: 'air_temp', stids: ['48'] },
      { variable: 'relative_humidity', stids: ['48'] },
      { variable: 'precip_accum_one_hour', stids: ['48'] },
      { variable: 'snow_depth_24h', stids: ['48'] },
      { variable: 'snow_depth', stids: ['48'] },
      { variable: 'pressure', stids: ['48'] },
      { variable: 'equip_temperature', stids: ['48'] },
    ],
  },
  {
    slug: 'dirtyface-mtn',
    legacySlug: 'dirtyfacemtn',
    displayName: 'Dirtyface Mt',
    regionSlug: 'Lake Wenatchee to Mission Ridge',
    archived: false,
    stids: ['10'],
    columns: [
      { variable: 'air_temp', stids: ['10'] },
      { variable: 'relative_humidity', stids: ['10'] },
      { variable: 'wind_speed_min', stids: ['10'] },
      { variable: 'wind_speed', stids: ['10'] },
      { variable: 'wind_gust', stids: ['10'] },
      { variable: 'wind_direction', stids: ['10'] },
    ],
  },
  {
    slug: 'lake-wenatchee',
    legacySlug: 'lakewenatchee',
    displayName: 'Lake Wenatchee',
    regionSlug: 'Lake Wenatchee to Mission Ridge',
    archived: false,
    stids: ['11'],
    columns: [
      { variable: 'air_temp', stids: ['11'] },
      { variable: 'relative_humidity', stids: ['11'] },
      { variable: 'precip_accum_one_hour', stids: ['11'] },
      { variable: 'snow_depth_24h', stids: ['11'] },
      { variable: 'snow_depth', stids: ['11'] },
    ],
  },
  {
    slug: 'mission-ridge',
    legacySlug: 'missionridge',
    displayName: 'Mission Ridge Ski Area',
    regionSlug: 'Lake Wenatchee to Mission Ridge',
    archived: false,
    stids: ['25', '26', '24'],
    columns: [
      { variable: 'air_temp', stids: ['25', '26', '24'] },
      { variable: 'relative_humidity', stids: ['25', '26'] },
      { variable: 'wind_speed_min', stids: ['25'] },
      { variable: 'wind_speed', stids: ['25'] },
      { variable: 'wind_gust', stids: ['25'] },
      { variable: 'wind_direction', stids: ['25'] },
      { variable: 'precip_accum_one_hour', stids: ['26'] },
      { variable: 'snow_depth_24h', stids: ['26'] },
      { variable: 'snow_depth', stids: ['26'] },
    ],
  },
  {
    slug: 'tumwater',
    legacySlug: 'tumwater',
    displayName: 'Tumwater Mt. & Leavenworth',
    regionSlug: 'Lake Wenatchee to Mission Ridge',
    archived: false,
    stids: ['19', '53'],
    columns: [
      { variable: 'air_temp', stids: ['19', '53'] },
      { variable: 'relative_humidity', stids: ['19', '53'] },
      { variable: 'wind_speed_min', stids: ['19'] },
      { variable: 'wind_speed', stids: ['19'] },
      { variable: 'wind_gust', stids: ['19'] },
      { variable: 'wind_direction', stids: ['19'] },
      { variable: 'precip_accum_one_hour', stids: ['53'] },
      { variable: 'snow_depth_24h', stids: ['53'] },
      { variable: 'snow_depth', stids: ['53', '19'] },
    ],
  },
  {
    slug: 'mt-hood-meadows',
    legacySlug: 'mthoodmeadows',
    displayName: 'Mt. Hood Meadows Ski Area',
    regionSlug: 'Mt Hood',
    archived: false,
    stids: ['42', '43'],
    columns: [
      { variable: 'air_temp', stids: ['42', '43'] },
      { variable: 'relative_humidity', stids: ['42', '43'] },
      { variable: 'wind_speed_min', stids: ['42'] },
      { variable: 'wind_speed', stids: ['42'] },
      { variable: 'wind_gust', stids: ['42'] },
      { variable: 'wind_direction', stids: ['42'] },
      { variable: 'precip_accum_one_hour', stids: ['43'] },
      { variable: 'snow_depth_24h', stids: ['43'] },
      { variable: 'snow_depth', stids: ['43'] },
      { variable: 'pressure', stids: ['43'] },
    ],
  },
  {
    slug: 'cascade-express',
    legacySlug: 'cascade_express',
    displayName: 'Mt. Hood Meadows - Cascade Express',
    regionSlug: 'Mt Hood',
    archived: false,
    stids: ['41'],
    columns: [
      { variable: 'air_temp', stids: ['41'] },
      { variable: 'relative_humidity', stids: ['41'] },
      { variable: 'wind_speed_min', stids: ['41'] },
      { variable: 'wind_speed', stids: ['41'] },
      { variable: 'wind_gust', stids: ['41'] },
      { variable: 'wind_direction', stids: ['41'] },
    ],
  },
  {
    slug: 'timberline-base',
    legacySlug: 'timberlinebase',
    displayName: 'Timberline Lodge',
    regionSlug: 'Mt Hood',
    archived: false,
    stids: ['44', '56'],
    columns: [
      { variable: 'air_temp', stids: ['44'] },
      { variable: 'relative_humidity', stids: ['44'] },
      { variable: 'wind_speed_min', stids: ['56'] },
      { variable: 'wind_speed', stids: ['56'] },
      { variable: 'wind_gust', stids: ['56'] },
      { variable: 'wind_direction', stids: ['56'] },
      { variable: 'precip_accum_one_hour', stids: ['44'] },
      { variable: 'snow_depth_24h', stids: ['44'] },
      { variable: 'snow_depth', stids: ['44'] },
    ],
  },
  {
    slug: 'timberline-upper',
    legacySlug: 'timberlineupper',
    displayName: 'Timberline - Magic Mile Chair',
    regionSlug: 'Mt Hood',
    archived: false,
    stids: ['45'],
    columns: [
      { variable: 'air_temp', stids: ['45'] },
      { variable: 'relative_humidity', stids: ['45'] },
      { variable: 'wind_speed_min', stids: ['45'] },
      { variable: 'wind_speed', stids: ['45'] },
      { variable: 'wind_gust', stids: ['45'] },
      { variable: 'wind_direction', stids: ['45'] },
    ],
  },
  {
    slug: 'skibowl-ski-area',
    legacySlug: 'skibowlgovtcamp',
    displayName: 'Skibowl Ski Area - Government Camp',
    regionSlug: 'Mt Hood',
    archived: false,
    stids: ['47', '46'],
    columns: [
      { variable: 'air_temp', stids: ['47', '46'] },
      { variable: 'relative_humidity', stids: ['47', '46'] },
      { variable: 'wind_speed_min', stids: ['47'] },
      { variable: 'wind_speed', stids: ['47'] },
      { variable: 'wind_gust', stids: ['47'] },
      { variable: 'wind_direction', stids: ['47'] },
      { variable: 'precip_accum_one_hour', stids: ['46'] },
      { variable: 'snow_depth', stids: ['47'] },
    ],
  },
]

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`station_groups_table_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`variable\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`station_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`station_groups_table_columns_order_idx\` ON \`station_groups_table_columns\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`station_groups_table_columns_parent_id_idx\` ON \`station_groups_table_columns\` (\`_parent_id\`);`,
  )
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
        tenant: tenant.id,
      },
      req,
    })
    stationIdByStid.set(station.stid, doc.id)
  }

  const stationId = (stid: string, group: string): number => {
    const id = stationIdByStid.get(stid)
    if (!id) throw new Error(`Station ${stid} missing for group ${group}`)
    return id
  }

  for (const group of GROUPS) {
    const region = regionIdBySlug.get(group.regionSlug)
    if (!region) throw new Error(`Region ${group.regionSlug} missing for group ${group.slug}`)

    await payload.create({
      collection: 'stationGroups',
      data: {
        slug: group.slug,
        legacySlug: group.legacySlug,
        displayName: group.displayName,
        archived: group.archived,
        region,
        stations: group.stids.map((stid) => stationId(stid, group.slug)),
        tableColumns: group.columns.map((column) => ({
          variable: column.variable,
          stations: column.stids.map((stid) => stationId(stid, group.slug)),
        })),
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
  await db.run(sql`DROP TABLE \`station_groups_table_columns\`;`)
  await db.run(sql`DROP TABLE \`station_groups\`;`)
  await db.run(sql`DROP TABLE \`station_groups_rels\`;`)
  await db.run(sql`DROP TABLE \`station_regions\`;`)
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
