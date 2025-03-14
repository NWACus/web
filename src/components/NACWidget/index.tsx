import React from 'react'

import Script from 'next/script'

export type Widget = 'map' | 'forecast' | 'warning' | 'stations' | 'observations'

export async function NACWidget({
  center,
  widget,
  id,
}: {
  center: string
  widget: Widget
  id: string
}) {
  return (
    <Script
      type="text/javascript"
      src="https://du6amfiq9m9h7.cloudfront.net/loader/nac-widget-loader.min.js"
      data-widget={widget}
      data-center={center.toUpperCase()}
      data-parent-id={id}
      data-google-maps-api-key={process.env.GOOGLE_MAPS_API_KEY}
    ></Script>
  )
}
