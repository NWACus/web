'use client'

/**
 * The repo's one Mapbox setup, shared by every native map.
 *
 * The danger map established it (#1216) and the station map reuses it; anything a second map
 * would otherwise copy from the first — the base style, the control adapter, the gesture
 * lockdown — lives here so the two cannot drift.
 */
import type { IControl, Map as MapboxMap } from 'mapbox-gl'
import mapboxgl from 'mapbox-gl'

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

/**
 * Whether the map can still be touched.
 *
 * `map.remove()` drops the style, and after it every source, layer and feature-state call throws.
 * React runs a component's unmount cleanups in hook order, so the hook that built the map (declared
 * first) removes it before the hooks that put layers on it get to take them off — which is exactly
 * what happens on a client-side navigation away from a map page. Those cleanups check this first.
 * `getStyle()` is the public signal: it is `undefined` once the style is gone.
 */
export function isLive(map: MapboxMap): boolean {
  return map.getStyle() !== undefined
}

/** A source is there to take down only while the map is live — see `isLive`. */
export function hasSource(map: MapboxMap, sourceId: string): boolean {
  return isLive(map) && map.getSource(sourceId) !== undefined
}

/**
 * A product map inside `wrapper`: the shared style, cooperative gestures, no rotation, zoom buttons.
 * Mapbox gets a fresh child element each time, because dev's double-mounted effects would otherwise
 * hand it one a previous map used. `remove` tears down both. `label` names the map region for
 * screen readers in place of Mapbox's generic "Map".
 */
export function createProductMap(
  wrapper: HTMLElement,
  token: string,
  view: { center: [number, number]; zoom: number },
  label?: string,
): { map: MapboxMap; remove: () => void } {
  mapboxgl.accessToken = token
  const container = wrapper.appendChild(document.createElement('div'))
  container.className = 'h-full w-full'
  const locale = label ? { 'Map.Title': label } : undefined
  const map = new mapboxgl.Map({
    container,
    style: MAP_STYLE,
    cooperativeGestures: true,
    locale,
    ...view,
  })
  disableRotation(map)
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
  return {
    map,
    remove: () => {
      map.remove()
      container.remove()
    },
  }
}
