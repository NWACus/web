'use client'

/**
 * PROTOTYPE ONLY — the danger-map variants for issue #1312 ("NWAC homepage map concerns").
 * Each is a structurally different answer to: how do we keep the map about NWAC's own zones?
 */
import type { FilterSpecification, Map as MapboxMap } from 'mapbox-gl'
import Link from 'next/link'
import { useCallback, useMemo, useRef, useState } from 'react'

import type { DangerMapSettings } from '@/services/nac/dangerMap/dangerMapSettings'
import {
  featuresToFit,
  zoneBounds,
  zonePopup,
  type ZoneRenderFeature,
} from '@/services/nac/dangerMap/dangerMapZones'
import {
  dangerColor,
  dangerLevelFromRating,
  dangerName,
  dangerTextColor,
} from '@/services/nac/dangerScale'

import type { ZoneCollection } from '../useDangerMap'
import { OUTLINE_LAYER_ID, SOURCE_ID } from '../zoneLayers'

import { areasFor, zoneOrder } from './nwacAreas'
import { addLabel, FLAT_LOOK, PrototypeMap, type MapLook } from './PrototypeMap'

export interface VariantProps {
  zones: ZoneCollection | null
  centerId: string
  settings: DangerMapSettings
}

/** The home page's danger-map height (DANGER_MAP_HEIGHT in HomeDangerMap). */
const MAP_HEIGHT = 500

const TILT_LOOK: MapLook = {
  pitch: 55,
  bearing: 0,
  terrain: false,
  fog: true,
  frame: 'fit',
  padding: { top: 10, bottom: 50, left: 10, right: 10 },
  tiltZoom: 0.55,
}

const TERRAIN_LOOK: MapLook = {
  ...TILT_LOOK,
  pitch: 62,
  bearing: -12,
  terrain: true,
  tiltZoom: 0.75,
}

function centroid(features: ZoneRenderFeature[]): [number, number] | null {
  const bounds = zoneBounds(features)
  if (!bounds) return null
  const [[west, south], [east, north]] = bounds
  return [(west + east) / 2, (south + north) / 2]
}

function ownZones(zones: ZoneCollection | null, centerId: string) {
  return (zones?.features ?? [])
    .filter((feature) => feature.properties.center_id === centerId)
    .sort((a, b) => zoneOrder(a.properties.name) - zoneOrder(b.properties.name))
}

function DangerChip({ feature }: { feature: ZoneRenderFeature }) {
  const level = dangerLevelFromRating(feature.properties.danger_level)
  const offSeason = feature.properties.off_season
  return (
    <span
      className="inline-block min-w-[6.5rem] shrink-0 whitespace-nowrap rounded px-2 py-0.5 text-center text-[11px] font-bold uppercase"
      style={{
        backgroundColor: offSeason ? '#e5e5e5' : dangerColor(level),
        color: offSeason ? '#525252' : dangerTextColor(level),
      }}
    >
      {offSeason ? 'Off season' : `${feature.properties.danger_level} · ${dangerName(level)}`}
    </span>
  )
}

/* ------------------------------------------------------------------------------------------ */

/** Baseline: today's native map with NWAC's dashboard viewport, flat. */
export function CurrentVariant({ zones, centerId, settings }: VariantProps) {
  return (
    <div className="rounded border" style={{ height: MAP_HEIGHT }}>
      <PrototypeMap zones={zones} centerId={centerId} settings={settings} look={FLAT_LOOK} />
    </div>
  )
}

/** Idea 1: pitch the camera so the tall NWAC area foreshortens into a wide frame; fog hides the rest. */
export function TiltVariant({ zones, centerId, settings }: VariantProps) {
  return (
    <div className="rounded border" style={{ height: MAP_HEIGHT }}>
      <PrototypeMap zones={zones} centerId={centerId} settings={settings} look={TILT_LOOK} />
    </div>
  )
}

/** Idea 2: the tilt plus 3D terrain, so the Cascade crest reads as the spine of the zones. */
export function TerrainVariant({ zones, centerId, settings }: VariantProps) {
  return (
    <div className="rounded border" style={{ height: MAP_HEIGHT }}>
      <PrototypeMap zones={zones} centerId={centerId} settings={settings} look={TERRAIN_LOOK} />
    </div>
  )
}

/** Idea 3: terrain map with a zone guide overlay — each zone, its rating, and the places in it. */
export function GuideVariant({ zones, centerId, settings }: VariantProps) {
  const mapRef = useRef<MapboxMap | null>(null)
  const [hoveredName, setHoveredName] = useState<string | null>(null)
  const own = ownZones(zones, centerId)
  const popupSettings = useMemo(() => ({ ...settings, centerId }), [settings, centerId])
  const look = useMemo<MapLook>(
    () => ({ ...TERRAIN_LOOK, padding: { top: 10, bottom: 110, left: 290, right: 10 } }),
    [],
  )

  const highlight = (feature: ZoneRenderFeature, on: boolean) => {
    const map = mapRef.current
    if (!map || feature.id == null || !map.getSource(SOURCE_ID)) return
    if (on) map.setFeatureState({ source: SOURCE_ID, id: feature.id }, { hover: true })
    else map.removeFeatureState({ source: SOURCE_ID, id: feature.id }, 'hover')
    setHoveredName(on ? feature.properties.name : null)
  }

  const flyTo = (feature: ZoneRenderFeature) => {
    const bounds = zoneBounds([feature])
    if (bounds) mapRef.current?.fitBounds(bounds, { padding: look.padding, pitch: 60, maxZoom: 10 })
  }

  const onMap = useCallback((map: MapboxMap | null) => {
    mapRef.current = map
  }, [])

  return (
    <div className="rounded border" style={{ height: Math.max(MAP_HEIGHT, 520) }}>
      <PrototypeMap
        zones={zones}
        centerId={centerId}
        settings={settings}
        look={look}
        onMap={onMap}
        onHoverZone={setHoveredName}
      >
        <div className="absolute bottom-2 left-2 top-12 z-10 flex w-[270px] flex-col overflow-hidden rounded-md bg-white shadow-lg">
          <div className="border-b px-3 py-2 text-xs font-bold uppercase tracking-wide text-neutral-600">
            {centerId} forecast zones
          </div>
          <ul className="flex-1 overflow-y-auto">
            {own.map((feature) => {
              const areas = areasFor(feature.properties.name)
              const { href } = zonePopup(feature.properties, popupSettings)
              const active = hoveredName === feature.properties.name
              return (
                <li
                  key={feature.id ?? feature.properties.name}
                  className={`cursor-pointer border-b px-3 py-2 ${active ? 'bg-neutral-100' : ''}`}
                  onMouseEnter={() => highlight(feature, true)}
                  onMouseLeave={() => highlight(feature, false)}
                  onClick={() => flyTo(feature)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{feature.properties.name}</span>
                    {href && (
                      <Link
                        href={href}
                        className="text-xs text-blue-700 underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Forecast
                      </Link>
                    )}
                  </div>
                  <div className="mt-1">
                    <DangerChip feature={feature} />
                  </div>
                  {areas.length > 0 && (
                    <div className="mt-1 text-xs leading-snug text-neutral-600">
                      {areas.join(' · ')}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </PrototypeMap>
    </div>
  )
}

function labelElement(className: string, title: string, subtitle?: string) {
  const element = document.createElement('div')
  element.className = className
  element.style.pointerEvents = 'none'
  const titleNode = document.createElement('div')
  titleNode.textContent = title
  element.appendChild(titleNode)
  if (subtitle) {
    const subtitleNode = document.createElement('div')
    subtitleNode.className = 'text-[10px] font-normal normal-case opacity-80'
    subtitleNode.textContent = subtitle
    element.appendChild(subtitleNode)
  }
  return element
}

/**
 * Idea 4: all centers drawn with their real danger colors, but ownership is carried by line and
 * label — NWAC gets a bold halo and zone names, others get dashed outlines and one center label.
 */
export function CentersVariant({ zones, centerId, settings }: VariantProps) {
  const own: FilterSpecification = ['==', ['get', 'center_id'], centerId]

  const decorate = useCallback(
    (map: MapboxMap, collection: ZoneCollection) => {
      map.setFilter(OUTLINE_LAYER_ID, own)
      map.addLayer(
        {
          id: 'proto-own-halo',
          type: 'line',
          source: SOURCE_ID,
          filter: own,
          paint: { 'line-color': '#0f172a', 'line-width': 10, 'line-blur': 6, 'line-opacity': 0.5 },
        },
        OUTLINE_LAYER_ID,
      )
      map.addLayer({
        id: 'proto-own-edge',
        type: 'line',
        source: SOURCE_ID,
        filter: own,
        paint: { 'line-color': '#0f172a', 'line-width': 2.5 },
      })
      map.addLayer({
        id: 'proto-others-edge',
        type: 'line',
        source: SOURCE_ID,
        filter: ['!', own],
        paint: { 'line-color': '#475569', 'line-width': 1.25, 'line-dasharray': [2, 2] },
      })

      const removers: (() => void)[] = []
      const byCenter = new Map<string, ZoneRenderFeature[]>()
      for (const feature of collection.features) {
        const id = feature.properties.center_id
        if (id === centerId) continue
        byCenter.set(id, [...(byCenter.get(id) ?? []), feature])
      }
      for (const [otherId, features] of byCenter) {
        const at = centroid(features)
        if (!at) continue
        removers.push(
          addLabel(
            map,
            at,
            labelElement(
              'max-w-[150px] rounded border border-dashed border-neutral-500 bg-white px-1.5 py-0.5 text-center text-[10px] font-semibold leading-tight text-neutral-700 shadow-sm',
              features[0]?.properties.center ?? otherId,
              `Not an ${centerId} forecast`,
            ),
          ),
        )
      }

      return () => removers.forEach((remove) => remove())
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [centerId],
  )

  const look = useMemo<MapLook>(() => ({ ...FLAT_LOOK, frame: 'fit' }), [])

  return (
    <div className="rounded border" style={{ height: MAP_HEIGHT }}>
      <PrototypeMap
        zones={zones}
        centerId={centerId}
        settings={settings}
        look={look}
        decorate={decorate}
      >
        <div className="absolute bottom-8 left-2 z-10 space-y-1 rounded bg-white px-2 py-1.5 text-[11px] shadow">
          <div className="flex items-center gap-2">
            <span className="inline-block h-0 w-6 border-t-[3px] border-neutral-900" />
            {centerId} forecast zones
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-0 w-6 border-t-2 border-dashed border-neutral-500" />
            Other avalanche centers
          </div>
        </div>
      </PrototypeMap>
    </div>
  )
}

/**
 * The old nwac.org approach: a narrow portrait map sized to the zones' own shape, with the zone
 * ratings as a list beside it so the width goes to information instead of Idaho.
 */
export function SkinnyVariant({ zones, centerId, settings }: VariantProps) {
  const own = ownZones(zones, centerId)
  const popupSettings = useMemo(() => ({ ...settings, centerId }), [settings, centerId])
  const look = useMemo<MapLook>(
    () => ({ ...FLAT_LOOK, frame: 'fit', padding: { top: 45, bottom: 10, left: 10, right: 55 } }),
    [],
  )
  const hasBounds = zoneBounds(featuresToFit(zones, centerId)) !== null

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {/* Even columns; the map stretches to the list's height so it stays NWAC-shaped. */}
      <div className="h-[520px] w-full rounded border sm:h-auto sm:min-h-[520px] sm:basis-1/2">
        <PrototypeMap zones={zones} centerId={centerId} settings={settings} look={look} />
      </div>
      <div className="sm:basis-1/2">
        <h2 className="mb-2 text-lg font-bold">Today&apos;s avalanche danger</h2>
        <ul className="divide-y rounded border">
          {own.map((feature) => {
            const { href } = zonePopup(feature.properties, popupSettings)
            const areas = areasFor(feature.properties.name)
            return (
              <li key={feature.id ?? feature.properties.name}>
                <Link
                  href={href ?? '#'}
                  className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-neutral-50"
                >
                  <span>
                    <span className="block text-sm font-semibold">{feature.properties.name}</span>
                    {areas.length > 0 && (
                      <span className="block text-xs text-neutral-500">{areas.join(' · ')}</span>
                    )}
                  </span>
                  <DangerChip feature={feature} />
                </Link>
              </li>
            )
          })}
          {!hasBounds && <li className="px-3 py-2 text-sm">Loading…</li>}
        </ul>
      </div>
    </div>
  )
}
