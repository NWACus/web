/**
 * The widget's marker colors, in one place for the map layers, the legend, the popups and the
 * detail page's location map. Observations: red with avalanches, orange with cracking or
 * collapsing, blue otherwise. Avalanches: by destructive size — D4 and up black, D3 red, D2
 * orange, smaller yellow.
 */
import type { ExpressionSpecification } from 'mapbox-gl'

import { D_SIZE_NUMBER } from '@/services/nac/observations/tileFilter'

export const MARKER_COLORS = {
  avalanches: '#dc3545',
  instability: '#fd7e14',
  observation: '#006cdf',
  d4: '#000000',
  d3: '#dc3545',
  d2: '#fd7e14',
  d1: '#ffc107',
} as const

export const OBSERVATION_LEGEND = [
  { color: MARKER_COLORS.observation, label: 'Observation' },
  { color: MARKER_COLORS.avalanches, label: 'Ob w/ Avalanches' },
  { color: MARKER_COLORS.instability, label: 'Ob w/ Cracking/Collapsing' },
]

export const AVALANCHE_LEGEND = [
  { color: MARKER_COLORS.d1, label: 'D1' },
  { color: MARKER_COLORS.d2, label: 'D2' },
  { color: MARKER_COLORS.d3, label: 'D3' },
  { color: MARKER_COLORS.d4, label: 'D4-5' },
]

export const OBSERVATION_COLOR: ExpressionSpecification = [
  'case',
  ['==', ['get', 'avalanches_observed'], true],
  MARKER_COLORS.avalanches,
  ['any', ['==', ['get', 'cracking'], true], ['==', ['get', 'collapsing'], true]],
  MARKER_COLORS.instability,
  MARKER_COLORS.observation,
]

export const AVALANCHE_COLOR: ExpressionSpecification = [
  'case',
  ['>=', D_SIZE_NUMBER, 4],
  MARKER_COLORS.d4,
  ['>=', D_SIZE_NUMBER, 3],
  MARKER_COLORS.d3,
  ['>=', D_SIZE_NUMBER, 2],
  MARKER_COLORS.d2,
  MARKER_COLORS.d1,
]

export function observationColor(avalanchesObserved: boolean, crackingOrCollapsing: boolean) {
  if (avalanchesObserved) return MARKER_COLORS.avalanches
  return crackingOrCollapsing ? MARKER_COLORS.instability : MARKER_COLORS.observation
}

export function avalancheColor(dSize: string | null): string {
  const size = Number(dSize)
  if (size >= 4) return MARKER_COLORS.d4
  if (size >= 3) return MARKER_COLORS.d3
  if (size >= 2) return MARKER_COLORS.d2
  return MARKER_COLORS.d1
}
