import mapboxgl, { LngLatLike, Map, Marker as MarkerType } from 'mapbox-gl'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const Marker = ({
  map,
  coordinates,
  label,
}: {
  map: Map
  coordinates: LngLatLike
  label: string
}) => {
  const markerRef = useRef<MarkerType>(undefined)
  const markerElementRef = useRef(document.createElement('div'))

  useEffect(() => {
    markerRef.current = new mapboxgl.Marker({
      element: markerElementRef.current,
      offset: [0, -36.75],
    })
      .setLngLat(coordinates)
      .addTo(map)

    return () => {
      if (markerRef.current) {
        markerRef.current.remove()
      }
    }
  }, [coordinates, map])

  return (
    <>
      {createPortal(
        <div className="flex flex-col items-center gap-1.5">
          <div className="bg-primary text-primary-foreground rounded-md py-1.5 px-3">
            <span className="">{label}</span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            version="1.1"
            width="40"
            height="40"
            viewBox="0 0 256 256"
            xmlSpace="preserve"
          >
            <g
              style={{
                stroke: 'none',
                strokeWidth: 0,
                strokeDasharray: 'none',
                strokeLinecap: 'butt',
                strokeLinejoin: 'miter',
                strokeMiterlimit: 10,
                fill: 'none',
                fillRule: 'nonzero',
                opacity: 1,
              }}
              transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)"
              filter="url(#pin-shadow)"
            >
              <path
                d="M 45 0 C 25.463 0 9.625 15.838 9.625 35.375 c 0 8.722 3.171 16.693 8.404 22.861 L 45 90 l 26.97 -31.765 c 5.233 -6.167 8.404 -14.139 8.404 -22.861 C 80.375 15.838 64.537 0 45 0 z M 45 48.705 c -8.035 0 -14.548 -6.513 -14.548 -14.548 c 0 -8.035 6.513 -14.548 14.548 -14.548 s 14.548 6.513 14.548 14.548 C 59.548 42.192 53.035 48.705 45 48.705 z"
                style={{
                  stroke: 'none',
                  strokeWidth: 1,
                  strokeDasharray: 'none',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'miter',
                  strokeMiterlimit: 10,
                  fill: 'rgb(0,0,0)',
                  fillRule: 'nonzero',
                  opacity: 1,
                }}
                transform=" matrix(1 0 0 1 0 0) "
              />
              <circle
                cx="45"
                cy="34.157"
                r="14.548"
                style={{
                  fill: '#fff',
                }}
              />
            </g>
          </svg>
        </div>,
        markerElementRef.current,
      )}
    </>
  )
}

export default Marker
