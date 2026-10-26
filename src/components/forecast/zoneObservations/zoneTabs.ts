/**
 * The zone tabs' vocabulary, matched to the widget's (`ForecastProduct.vue`, `ObservationCard.vue`
 * and the badge components, afp-public-widgets 8d2fb85e).
 */
import { ProductType } from '@/services/nac/model/forecast'
import { format, parseISO } from 'date-fns'

export type ZoneTab = 'forecast' | 'observations' | 'avalanches'

/** The tab from `?tab=`; anything else is the forecast. */
export function parseZoneTab(value: string | null): ZoneTab {
  return value === 'observations' || value === 'avalanches' ? value : 'forecast'
}

/** The widget's first-tab label, not the page title's "General Avalanche Information". */
export function forecastTabLabel(productType: ProductType): string {
  return productType === ProductType.Summary ? 'Avalanche Information' : 'Avalanche Forecast'
}

/** The widget's card date, `MMM D, YYYY`. */
export function cardDate(date: string): string {
  return format(parseISO(date), 'MMM d, yyyy')
}

export function zoneObservationsEndpoint(centerSlug: string, zoneSlug: string): string {
  return `/api/${centerSlug}/zone-observations?zone=${encodeURIComponent(zoneSlug)}`
}

/** The widget's `triggerSimple` groups, keyed by trigger code. */
const TRIGGER_GROUPS: [string, string[]][] = [
  ['Unknown', ['U']],
  ['Natural', ['N', 'NO', 'NC', 'NE', 'NI', 'NL', 'NS', 'NR']],
  ['Human', ['AS', 'AR', 'AM', 'AK', 'AV', 'AI', 'AF', 'AU', 'AO']],
  ['Explosive', ['AA', 'AE', 'AB', 'AL', 'AX', 'AH', 'AP']],
  ['Wildlife', ['AW']],
]

export function triggerLabel(trigger: string | null): string {
  if (!trigger) return ''
  return TRIGGER_GROUPS.find(([, codes]) => codes.includes(trigger))?.[0] ?? ''
}

export type PillTone = 'red' | 'orange' | 'yellow' | 'black' | 'plain'

/**
 * D-size tint by whole size, as `AvalancheSizeIcon` does: D1 yellow, D2 orange, D3 red, D4+ black.
 * A size that isn't a number gets no tint there, so a plain badge here.
 */
export function sizeTone(dSize: string): PillTone {
  const whole = Math.floor(Number(dSize))
  if (!Number.isFinite(whole)) return 'plain'
  if (whole <= 1) return 'yellow'
  if (whole === 2) return 'orange'
  if (whole === 3) return 'red'
  return 'black'
}
