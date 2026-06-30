/**
 * Expandable "Elevation Band Descriptions" disclosure shown under the danger rows, matching the
 * widget's affordance. Pairs each of the zone's elevation-band names (which may carry HTML such
 * as elevation ranges) with a short description of the terrain that band covers.
 */
import type { ElevationBandNames } from '@/services/nac/types/schemas'

import { sanitizeHtml } from './sanitizeHtml'

const BAND_DESCRIPTIONS: { key: keyof ElevationBandNames; description: string }[] = [
  {
    key: 'upper',
    description:
      'The highest, most exposed elevations. Wind and weather have the greatest effect on the snowpack here, and terrain is generally open.',
  },
  {
    key: 'middle',
    description: 'The transitional band around treeline, a mix of open slopes and sparser trees.',
  },
  {
    key: 'lower',
    description:
      'The lowest, most sheltered elevations, generally below treeline and more protected from wind.',
  },
]

interface ElevationBandDescriptionsProps {
  elevationBandNames: ElevationBandNames
}

export function ElevationBandDescriptions({ elevationBandNames }: ElevationBandDescriptionsProps) {
  return (
    <details className="rounded-md border text-sm">
      <summary className="cursor-pointer select-none px-3 py-2 font-medium">
        Elevation Band Descriptions
      </summary>
      <dl className="space-y-3 px-3 pb-3">
        {BAND_DESCRIPTIONS.map(({ key, description }) => (
          <div key={key}>
            <dt
              className="font-semibold"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(elevationBandNames[key]) }}
            />
            <dd className="text-muted-foreground">{description}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
