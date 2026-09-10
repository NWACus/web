/**
 * The map's content as text.
 *
 * A Mapbox map is a `<canvas>`: nothing on it is reachable by keyboard or exposed to a screen
 * reader, so on its own the danger map would publish today's avalanche danger in a form some
 * readers cannot get at. This renders the same zones as a visually hidden list of links — the
 * rating, whether a warning is in effect, and the forecast — so the information is available to
 * everyone even though the picture isn't. Becomes visible on focus, so a keyboard user can see
 * where they are while tabbing through it. On an information exchange the same list points at
 * observations, as the map's popups do.
 */
import type {
  ZonePopup,
  ZonePopupSettings,
  ZoneRenderFeature,
} from '@/services/nac/dangerMap/dangerMapZones'
import { zonePopup } from '@/services/nac/dangerMap/dangerMapZones'

interface ZoneListProps {
  zones: { features: ZoneRenderFeature[] } | null
  settings: ZonePopupSettings
}

/**
 * What the list is a list of. An exchange's own zones are ways into observations, but on an
 * all-centers map they sit beside neighboring centers' rated zones, and a heading that named
 * either would misdescribe the other — so that case gets a heading that claims nothing.
 */
function listHeading({ informationExchange, allCenters }: ZonePopupSettings): string {
  if (!informationExchange) return 'Avalanche danger by forecast zone'
  return allCenters ? 'Forecast zones on the map' : 'Observations by zone'
}

export function ZoneList({ zones, settings }: ZoneListProps) {
  const features = zones?.features ?? []
  if (features.length === 0) return null

  return (
    <div className="sr-only focus-within:not-sr-only focus-within:block">
      <h3>{listHeading(settings)}</h3>
      <ul>
        {features.map((zone) => (
          <ZoneListItem
            key={String(zone.id ?? zone.properties.name)}
            popup={zonePopup(zone.properties, settings)}
          />
        ))}
      </ul>
    </div>
  )
}

function ZoneListItem({ popup }: { popup: ZonePopup }) {
  return (
    <li>
      <ZoneName popup={popup} />
      {': '}
      {popup.headline}
      {popup.hasWarning && ' — Avalanche Warning in effect'}
    </li>
  )
}

/** The zone's name, linked to its forecast when there is one to link to. */
function ZoneName({ popup }: { popup: ZonePopup }) {
  if (!popup.href) return popup.zoneName

  const external = popup.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  return (
    <a href={popup.href} {...external}>
      {popup.zoneName}
    </a>
  )
}
