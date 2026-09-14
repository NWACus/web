/**
 * The map's content as text.
 *
 * A Mapbox map is a `<canvas>`: nothing on it is reachable by keyboard or exposed to a screen
 * reader, so on its own the danger map would publish today's avalanche danger in a form some
 * readers cannot get at. The same zones as a list of links — the rating, whether a warning is in
 * effect, and the forecast, or observations on an information exchange.
 *
 * Invisible until something inside it takes focus, then it opens as a card over the map rather
 * than reflowing the page beneath it. `opacity-0` rather than `sr-only` because `not-sr-only`
 * resets `position` to static, which would fight the absolute placement the card needs;
 * `pointer-events-none` keeps it from swallowing hover on the zones underneath while invisible.
 */
import type {
  ZonePopup,
  ZonePopupSettings,
  ZoneRenderFeature,
} from '@/services/nac/dangerMap/dangerMapZones'
import { zonePopup } from '@/services/nac/dangerMap/dangerMapZones'
import { dangerColor } from '@/services/nac/dangerScale'
import { cn } from '@/utilities/ui'

interface ZoneListProps {
  zones: { features: ZoneRenderFeature[] } | null
  settings: ZonePopupSettings
}

/** Clears the avalanche.org link (29px tall at a 10px inset) with a gap of its own. */
const BELOW_CORNER_LINK = 'top-[47px]'

/** An exchange's all-centers map lists zones of both kinds, so its heading claims neither. */
function listHeading({ informationExchange, allCenters }: ZonePopupSettings): string {
  if (!informationExchange) return 'Avalanche danger by forecast zone'
  return allCenters ? 'Forecast zones on the map' : 'Observations by zone'
}

export function ZoneList({ zones, settings }: ZoneListProps) {
  const features = zones?.features ?? []
  if (features.length === 0) return null

  return (
    <div
      className={cn(
        'pointer-events-none absolute left-2.5 z-10 w-60 opacity-0 transition-opacity',
        BELOW_CORNER_LINK,
        // An all-centers map lists every zone in the country, so the card scrolls.
        'max-h-[calc(100%-3.5rem)] overflow-y-auto',
        'rounded-md bg-white text-left shadow-lg',
        'focus-within:pointer-events-auto focus-within:opacity-100',
      )}
    >
      <h3 className="sticky top-0 border-b bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        {listHeading(settings)}
      </h3>
      <ul className="p-1">
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

/** Row chrome, shared so a zone with nowhere to link still lines up with the ones that do. */
const ROW = 'block rounded px-2 py-1.5 text-xs leading-tight'

function ZoneListItem({ popup }: { popup: ZonePopup }) {
  const body = (
    <>
      <span className="block font-medium text-neutral-900">{popup.zoneName}</span>
      <span className="block text-neutral-600">{popup.headline}</span>
      {popup.hasWarning && (
        <span className="block font-semibold" style={{ color: dangerColor(4) }}>
          Avalanche Warning in effect
        </span>
      )}
    </>
  )

  return (
    <li>
      {popup.href ? (
        <a
          href={popup.href}
          {...(popup.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          // The whole row is the target, so its accessible name is "{zone}: {what you get}". The
          // outline is inset so it draws inside the card rather than under its rounded edge.
          className={cn(
            ROW,
            'hover:bg-neutral-100 focus-visible:bg-neutral-100',
            'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2',
          )}
        >
          {body}
        </a>
      ) : (
        <span className={ROW}>{body}</span>
      )}
    </li>
  )
}
