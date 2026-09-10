'use client'

/**
 * The repo's one Mapbox setup, shared by every native map.
 *
 * The danger map established it (#1216) and the station map reuses it; anything a second map
 * would otherwise copy from the first — the base style, the control adapter, the gesture
 * lockdown — lives here so the two cannot drift.
 */
import type { IControl, Map as MapboxMap } from 'mapbox-gl'

/** The `avalanche-org` "AFP Custom" style, shared with afp-public-widgets and dashboard-v2. */
export const MAP_STYLE = 'mapbox://styles/avalanche-org/cmg1bsw48002301pshwzoen5y'

/**
 * Hand an existing React-rendered node to Mapbox as a control.
 *
 * `onRemove` deliberately does nothing: React created the node and React unmounts it, so detaching
 * it here too would be a double removal. Mapbox only needs to be told where to put it.
 */
export function asControl(element: HTMLElement): IControl {
  return { onAdd: () => element, onRemove: () => {} }
}

/** Rotation and pitch add nothing to a 2D product map and make it easy to get lost. */
export function disableRotation(map: MapboxMap): void {
  map.dragRotate.disable()
  map.touchPitch.disable()
  map.touchZoomRotate.disableRotation()
}
