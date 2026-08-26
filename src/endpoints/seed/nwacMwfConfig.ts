import type { Setting } from '@/payload-types'

// NWAC's real MWF configuration, transcribed from the dashboard-v2 staging
// AFP Settings (2026-08-26) and verified against the live Airfire feeds:
// precip12.json carries exactly these 15 station codes with FH24/36/48/60
// fields, and the SZ zone summaries carry the ten 2-letter zone codes
// (temps FH24/36/48/60, winds FH18..FH60 at 6-hour spacing).
//
// Point coordinates are approximate (nav/map use only — guidance matches on
// the station code). The staging config also carries three GRIB2 sources
// (HRRR 3km, RRFS 3km, NBM ~5km); grib2 is out of scope for the local proof
// (PRD contingency), so only the WRF JSON sources are represented here.
export const NWAC_MWF_CONFIG: NonNullable<Setting['mwf']> = {
  // Row order is display order in the editor and public render; this is the
  // staging forecast form's order (West Slopes North first … Olympics last).
  zones: [
    {
      code: 'west-slopes-north',
      name: 'West Slopes North',
      airfireZoneId: 'wn',
      nacZoneIds: '1646',
    },
    {
      code: 'west-slopes-central',
      name: 'West Slopes Central',
      airfireZoneId: 'wc',
      nacZoneIds: '1647',
    },
    {
      code: 'west-slopes-south',
      name: 'West Slopes South',
      airfireZoneId: 'ws',
      nacZoneIds: '1648',
    },
    {
      code: 'east-slopes-north',
      name: 'East Slopes North',
      airfireZoneId: 'en',
      nacZoneIds: '1654',
    },
    {
      code: 'east-slopes-central',
      name: 'East Slopes Central',
      airfireZoneId: 'ec',
      nacZoneIds: '1655',
    },
    {
      code: 'east-slopes-south',
      name: 'East Slopes South',
      airfireZoneId: 'es',
      nacZoneIds: '1656',
    },
    { code: 'stevens-pass', name: 'Stevens Pass', airfireZoneId: 'st', nacZoneIds: '1649' },
    { code: 'snoqualmie-pass', name: 'Snoqualmie Pass', airfireZoneId: 'sn', nacZoneIds: '1653' },
    { code: 'mt-hood', name: 'Mt Hood', airfireZoneId: 'hd', nacZoneIds: '1657' },
    { code: 'olympics', name: 'Olympics', airfireZoneId: 'ol', nacZoneIds: '1645' },
  ],
  points: [
    {
      code: 'HUR53',
      name: 'Hurricane Ridge',
      zoneCode: 'olympics',
      latitude: 47.97,
      longitude: -123.5,
    },
    {
      code: 'MTB42',
      name: 'Mt Baker Ski Area',
      zoneCode: 'west-slopes-north',
      latitude: 48.857,
      longitude: -121.676,
    },
    {
      code: 'WAP55',
      name: 'Washington Pass',
      zoneCode: 'east-slopes-north',
      latitude: 48.52,
      longitude: -120.655,
    },
    {
      code: 'BAR24',
      name: 'Mtn Loop — Barlow Pass',
      zoneCode: 'west-slopes-central',
      latitude: 48.027,
      longitude: -121.444,
    },
    {
      code: 'GHL56',
      name: 'Salmon la Sac — Gallagher Head',
      zoneCode: 'east-slopes-central',
      latitude: 47.385,
      longitude: -121.067,
    },
    {
      code: 'STS40',
      name: 'Stevens Pass',
      zoneCode: 'stevens-pass',
      latitude: 47.745,
      longitude: -121.089,
    },
    {
      code: 'SNO30',
      name: 'Snoqualmie Pass',
      zoneCode: 'snoqualmie-pass',
      latitude: 47.424,
      longitude: -121.414,
    },
    {
      code: 'LVN11',
      name: 'Leavenworth',
      zoneCode: 'east-slopes-central',
      latitude: 47.596,
      longitude: -120.66,
    },
    {
      code: 'MSR52',
      name: 'Mission Ridge',
      zoneCode: 'east-slopes-central',
      latitude: 47.292,
      longitude: -120.399,
    },
    {
      code: 'CMT46',
      name: 'Crystal Mountain',
      zoneCode: 'west-slopes-south',
      latitude: 46.936,
      longitude: -121.474,
    },
    {
      code: 'PVC54',
      name: 'Paradise',
      zoneCode: 'west-slopes-south',
      latitude: 46.786,
      longitude: -121.735,
    },
    {
      code: 'WPS58',
      name: 'White Pass',
      zoneCode: 'east-slopes-south',
      latitude: 46.64,
      longitude: -121.39,
    },
    {
      code: 'DAR70',
      name: 'Tieton River — Darland Mt',
      zoneCode: 'east-slopes-south',
      latitude: 46.6,
      longitude: -121.05,
    },
    {
      code: 'MHM54',
      name: 'Mt Hood Meadows',
      zoneCode: 'mt-hood',
      latitude: 45.33,
      longitude: -121.66,
    },
    {
      code: 'TIM59',
      name: 'Timberline',
      zoneCode: 'mt-hood',
      latitude: 45.331,
      longitude: -121.711,
    },
  ],
  extendedSnowLevelZones: [
    { zoneCode: 'olympics' },
    { zoneCode: 'west-slopes-north' },
    { zoneCode: 'stevens-pass' },
  ],
  models: [
    {
      name: 'WRF3UW1 1.33km',
      sourceType: 'point-json',
      url: 'https://m2.airfire.org/PNW/1.33km/NWACImages/{run}/precip12.json',
      config: {
        stationKey: 'station',
        runCycleHours: [0, 12],
        periodFields: { night1: 'FH24', day2: 'FH36', night2: 'FH48', day3: 'FH60' },
      },
    },
    {
      name: 'WRF temps',
      sourceType: 'zone-summary-json',
      url: 'https://m2.airfire.org/UWFS/1.33km/NWACImages/{run}/SZ_MaxTemperature_12hr.json',
      config: {
        table: 'temps',
        zoneKey: 'zone',
        runCycleHours: [0, 12],
        urls: {
          high: 'https://m2.airfire.org/UWFS/1.33km/NWACImages/{run}/SZ_MaxTemperature_12hr.json',
          low: 'https://m2.airfire.org/UWFS/1.33km/NWACImages/{run}/SZ_MinTemperature_12hr.json',
        },
        periodFields: { night1: 'FH24', day2: 'FH36', night2: 'FH48', day3: 'FH60' },
      },
    },
    {
      name: 'WRF winds',
      sourceType: 'zone-summary-json',
      url: 'https://m2.airfire.org/UWFS/1.33km/NWACImages/{run}/SZ_WindSpeed_6hr.json',
      config: {
        table: 'winds',
        zoneKey: 'zone',
        runCycleHours: [0, 12],
        urls: {
          speed: 'https://m2.airfire.org/UWFS/1.33km/NWACImages/{run}/SZ_WindSpeed_6hr.json',
          dir: 'https://m2.airfire.org/UWFS/1.33km/NWACImages/{run}/SZ_WindDir_6hr.json',
        },
        // 6-hour fields FH18..FH60 map onto the eight blocks in order, in step
        // with the temps mapping (night1 ends FH24, day2 ends FH36, …).
        blockFields: {
          ev1: 'FH18',
          nt1: 'FH24',
          am2: 'FH30',
          pm2: 'FH36',
          ev2: 'FH42',
          nt2: 'FH48',
          am3: 'FH54',
          pm3: 'FH60',
        },
      },
    },
  ],
}
