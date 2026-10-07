import type { CheckboxField } from 'payload'

// The views a station page can show, in tab order. `csv` keeps its key from
// the `?range=csv` URL the tab has always used.
export const STATION_TABS = [
  { key: 'table', label: 'Table' },
  { key: 'graphs', label: 'Graphs' },
  { key: 'csv', label: 'Download' },
] as const

export type StationTabKey = (typeof STATION_TABS)[number]['key']

type TabToggles = Partial<Record<StationTabKey, boolean | null>>

// Unset counts as shown, so pages saved before the toggles existed keep every tab.
export function toStationTabs(toggles: TabToggles | null | undefined): StationTabKey[] {
  const shown = STATION_TABS.filter((tab) => toggles?.[tab.key] !== false).map((tab) => tab.key)
  return shown.length > 0 ? shown : STATION_TABS.map((tab) => tab.key)
}

function isStationTabKey(value: string): value is StationTabKey {
  return STATION_TABS.some((tab) => tab.key === value)
}

// Which tab a `?range=` lands on. Anything that isn't a tab key is the table
// (legacy `?range=24h` links, whose range becomes the table's period); a hidden
// tab falls back to the default, which is Download for an archived page.
export function resolveStationTab(
  tabs: StationTabKey[],
  archived: boolean,
  range?: string,
): { tab: StationTabKey; period?: string } {
  const fallback = archived && tabs.includes('csv') ? 'csv' : tabs[0]
  const requested = range ?? fallback
  const tab = isStationTabKey(requested) ? requested : 'table'
  if (!tabs.includes(tab)) return { tab: fallback }
  return { tab, period: tab === 'table' ? range : undefined }
}

const atLeastOneTab: CheckboxField['validate'] = (value, { siblingData }) => {
  if (value) return true
  const toggles: TabToggles = typeof siblingData === 'object' && siblingData ? siblingData : {}
  return STATION_TABS.some((tab) => toggles[tab.key] !== false) || 'Show at least one tab.'
}

export const stationTabFields: CheckboxField[] = STATION_TABS.map((tab) => ({
  name: tab.key,
  type: 'checkbox',
  label: tab.label,
  defaultValue: true,
  validate: atLeastOneTab,
  admin: { components: { Field: '@/components/ToggleField#ToggleField' } },
}))
