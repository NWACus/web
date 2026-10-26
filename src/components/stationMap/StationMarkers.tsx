'use client'

/**
 * Every visible station and webcam, as markers on the map.
 */
import type { Map as MapboxMap } from 'mapbox-gl'

import { stationPointId, webcamPointId, type MapPoint } from '@/services/snowobs/stationMap/filters'
import { sourceColor } from '@/services/snowobs/stationMap/format'
import type { StationMapStation, StationMapWebcam } from '@/services/snowobs/stationMap/model'

import { MapMarker } from './MapMarker'
import { StationMarker, WebcamMarker } from './StationMarker'

interface StationMarkersProps {
  map: MapboxMap
  stations: StationMapStation[]
  webcams: StationMapWebcam[]
  selectedId: string | null
  /** The variable labelling each marker, or null for plain dots. */
  labelVariable: string | null
  colorBySource: boolean
  onClick: (point: MapPoint) => void
}

export function StationMarkers({
  map,
  stations,
  webcams,
  selectedId,
  labelVariable,
  colorBySource,
  onClick,
}: StationMarkersProps) {
  return (
    <>
      {stations.map((station) => {
        const point: MapPoint = { kind: 'station', id: stationPointId(station.stid), station }
        const selected = point.id === selectedId
        return (
          <MapMarker key={point.id} map={map} lngLat={station.coordinates} raised={selected}>
            <StationMarker
              name={station.name}
              color={sourceColor(station.source, colorBySource)}
              label={labelVariable ? (station.data[labelVariable] ?? null) : null}
              isWindDirection={labelVariable === 'wind_direction'}
              highlighted={selected}
              onClick={() => onClick(point)}
            />
          </MapMarker>
        )
      })}
      {webcams.map((webcam) => {
        const point: MapPoint = { kind: 'webcam', id: webcamPointId(webcam.id), webcam }
        const selected = point.id === selectedId
        return (
          <MapMarker key={point.id} map={map} lngLat={webcam.coordinates} raised={selected}>
            <WebcamMarker
              title={webcam.title}
              highlighted={selected}
              onClick={() => onClick(point)}
            />
          </MapMarker>
        )
      })}
    </>
  )
}
