/**
 * The observation viewer's vocabulary: filter options, the codes behind them, and the labels the
 * detail pages give stored values. Copied from the legacy widget's `constants/observations.js`
 * and `constants/problems.js`, which are what the submission form wrote and so what the records
 * carry.
 */

export interface Option<V extends string = string> {
  value: V
  label: string
}

export const OBSERVER_TYPES: Option[] = [
  { value: 'forecaster', label: 'Forecaster' },
  { value: 'observer', label: 'Observer' },
  { value: 'intern', label: 'Intern' },
  { value: 'educator', label: 'Educator' },
  { value: 'public', label: 'Public' },
  { value: 'professional', label: 'Professional' },
]

export const ACTIVITIES: Option[] = [
  { value: 'skiing_snowboarding', label: 'Skiing/Snowboarding' },
  { value: 'snowmobiling_snowbiking', label: 'Snowmobiling/Snowbiking' },
  { value: 'xcskiing_snowshoeing', label: 'XC Skiing/Snowshoeing' },
  { value: 'climbing', label: 'Climbing' },
  { value: 'walking', label: 'Walking/Hiking' },
  { value: 'driving', label: 'Driving' },
  { value: 'flying', label: 'Flying/Heli' },
  { value: 'other', label: 'Other' },
]

export const ASPECTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const

/** The trigger filter's groups, each standing for the codes the form offers under it. */
export const TRIGGER_GROUPS = [
  { label: 'Unknown', codes: ['U'] },
  { label: 'Natural', codes: ['N', 'NO', 'NC', 'NE', 'NI', 'NL', 'NS', 'NR'] },
  { label: 'Human', codes: ['AS', 'AR', 'AM', 'AK', 'AV', 'AI', 'AF', 'AU', 'AO'] },
  { label: 'Explosive', codes: ['AA', 'AE', 'AB', 'AL', 'AX', 'AH', 'AP'] },
  { label: 'Wildlife', codes: ['AW'] },
] as const

export type TriggerGroup = (typeof TRIGGER_GROUPS)[number]['label']

/** The trigger modifier ("cause") filter: Intentional, Unintentional, Remote, Sympathetic. */
export const CAUSES = [
  { label: 'Intentional', code: 'c' },
  { label: 'Unintentional', code: 'u' },
  { label: 'Remote', code: 'r' },
  { label: 'Sympathetic', code: 'y' },
] as const

export type CauseLabel = (typeof CAUSES)[number]['label']

/** The avalanche problem filter's nine names, in the widget's order. */
export const AVALANCHE_PROBLEMS = [
  'Dry Loose',
  'Storm Slab',
  'Wind Slab',
  'Persistent Slab',
  'Deep Persistent Slab',
  'Wet Loose',
  'Wet Slab',
  'Glide',
  'Cornice',
] as const

/**
 * The impacts filter. Each option stands for one or more count columns; the API ORs every
 * `field[gt]=0` it is sent, so "Humans Buried" is any of the three burial counts.
 */
export const IMPACTS = [
  { value: 'Humans Caught', group: 'Humans', label: 'Caught', fields: ['humans_caught'] },
  {
    value: 'Humans Buried',
    group: 'Humans',
    label: 'Buried',
    fields: ['humans_part_buried_non_crit', 'humans_part_buried_crit', 'humans_fully_buried'],
  },
  { value: 'Humans Injured', group: 'Humans', label: 'Injured', fields: ['humans_injured'] },
  { value: 'Humans Killed', group: 'Humans', label: 'Killed', fields: ['humans_killed'] },
  { value: 'Vehicles Hit', group: 'Vehicles', label: 'Hit', fields: ['vehicles_hit'] },
  { value: 'Vehicles Damaged', group: 'Vehicles', label: 'Damaged', fields: ['vehicles_damaged'] },
  {
    value: 'Vehicles Buried',
    group: 'Vehicles',
    label: 'Buried',
    fields: ['vehicles_fully_buried'],
  },
  { value: 'Structures Hit', group: 'Structures', label: 'Hit', fields: ['structures_hit'] },
  {
    value: 'Structures Damaged',
    group: 'Structures',
    label: 'Damaged',
    fields: ['structures_damaged'],
  },
  {
    value: 'Structures Destroyed',
    group: 'Structures',
    label: 'Destroyed',
    fields: ['structures_destroyed'],
  },
] as const

export type ImpactValue = (typeof IMPACTS)[number]['value']

// ─── Detail labels ──────────────────────────────────────────────────────────

export const CLOUD_COVER: Option[] = [
  { value: 'clear', label: 'Clear (No clouds)' },
  { value: 'few', label: 'Few (Mostly Clear, up to 2/8 covered)' },
  { value: 'scattered', label: 'Scattered (Partly Cloudy, 3/8 to 4/8 covered)' },
  { value: 'broken', label: 'Broken (Mostly Cloudy, more than 4/8 but less than 8/8)' },
  { value: 'overcast', label: 'Overcast (Cloudy, 8/8 covered)' },
  { value: 'obscured', label: 'Obscured (Sky not visible due to fog or non-cloud layer)' },
]

/** "small smounts" is the form's own misspelling, and so what records carry. */
export const SNOW_AVAILABLE_FOR_TRANSPORT: Option[] = [
  { value: 'none', label: 'None' },
  { value: 'small smounts', label: 'Small Amounts' },
  { value: 'moderate amounts', label: 'Moderate Amounts' },
  { value: 'large amounts', label: 'Large Amounts' },
]

export const WIND_LOADING: Option[] = [
  { value: 'none', label: 'None' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'intense', label: 'Intense' },
  { value: 'previous', label: 'Previous' },
  { value: 'unknown', label: 'Unknown' },
]

export const AVALANCHE_TYPES: Option[] = [
  { value: 'SS', label: 'SS-Soft Slab' },
  { value: 'HS', label: 'HS-Hard Slab' },
  { value: 'L', label: 'L-Dry Loose' },
  { value: 'WL', label: 'WL-Wet Loose' },
  { value: 'WS', label: 'WS-Wet Slab' },
  { value: 'C', label: 'C-Cornice' },
  { value: 'R', label: 'R-Roof' },
  { value: 'SF', label: 'SF-Slush Flow' },
  { value: 'I', label: 'I-Ice Fall' },
  { value: 'U', label: 'U-Unknown' },
]

export const BED_SURFACES: Option[] = [
  { value: 'S', label: 'S-New Snow' },
  { value: 'I', label: 'I-New/Old Interface' },
  { value: 'O', label: 'O-Old Snow' },
  { value: 'G', label: 'G-Ground' },
  { value: 'U', label: 'U-Unknown' },
]

export const WEAK_LAYERS: Option[] = [
  { value: 'PP', label: 'PP-Precipitation Particles' },
  { value: 'DF', label: 'DF-Decomposing and Fragmented Particles' },
  { value: 'RG', label: 'RG-Rounded Grains' },
  { value: 'FC', label: 'FC-Faceted Crystals' },
  { value: 'DH', label: 'DH-Depth Hoar' },
  { value: 'SH', label: 'SH-Surface Hoar' },
  { value: 'MF', label: 'MF-Melt Forms' },
  { value: 'IF', label: 'IF-Ice Formations' },
  { value: 'MM', label: 'MM-Machine Made Snow' },
]

export const TRIGGERS: Option[] = [
  { value: 'N', label: 'N-Natural' },
  { value: 'U', label: 'U-Unknown' },
  { value: 'AS', label: 'AS-Skier' },
  { value: 'AR', label: 'AR-Snowboarder' },
  { value: 'AM', label: 'AM-Snowmobile' },
  { value: 'AW', label: 'AW-Wild or Domesticated Animal' },
  { value: 'AV', label: 'AV-Vehicle' },
  { value: 'NC', label: 'NC-Cornice Fall' },
  { value: 'NE', label: 'NE-Earthquake' },
  { value: 'NI', label: 'NI-Ice fall' },
  { value: 'NL', label: 'NL-Triggered by Loose Snow Avalanche' },
  { value: 'NS', label: 'NS-Triggered by Slab Avalanche' },
  { value: 'NR', label: 'NR-Rock fall' },
  { value: 'AI', label: 'AI-Snowshoer' },
  { value: 'AF', label: 'AF-Foot penetration' },
  { value: 'AK', label: 'AK-Snowcat' },
  { value: 'NO', label: 'NO-Unclassified natural trigger' },
  { value: 'AU', label: 'AU-Unknown artificial trigger' },
  { value: 'AO', label: 'AO-Unclassified artificial trigger' },
  { value: 'AA', label: 'AA-Artillery' },
  { value: 'AE', label: 'AE-Explosive triggered' },
  { value: 'AL', label: 'AL-Avalauncher' },
  { value: 'AB', label: 'AB-Air blast' },
  { value: 'AC', label: 'AC-Human-caused cornice fall' },
  { value: 'AX', label: 'AX-Gas exploder' },
  { value: 'AH', label: 'AH-Explosives from helicopter' },
  { value: 'AP', label: 'AP-Pre-placed, remotely detonated explosive' },
]

export const CAUSE_LABELS: Option[] = [
  { value: 'c', label: 'c-Intentional' },
  { value: 'u', label: 'u-Unintentional' },
  { value: 'r', label: 'r-Remote' },
  { value: 'y', label: 'y-Sympathetic' },
]

export const TERMINI: Option[] = [
  { value: 'TP', label: 'TP - Top of Path' },
  { value: 'MP', label: 'MP - Middle of Path' },
  { value: 'BP', label: 'BP - Bottom of Path' },
  { value: 'U', label: 'U - Unknown' },
]

/**
 * A stored code's label, or the code itself when the list doesn't know it. The widget's `getLabel`
 * threw on an unknown code, taking the whole detail view down with it.
 */
export function labelFor(value: string | null, options: Option[]): string | null {
  if (!value) return null
  return options.find((option) => option.value === value)?.label ?? value
}

/** The trigger filter group a code belongs to, which is how list cards name a trigger. */
export function triggerGroupOf(code: string | null): TriggerGroup | null {
  if (!code) return null
  return TRIGGER_GROUPS.find((group) => group.codes.some((c) => c === code))?.label ?? null
}
