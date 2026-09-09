'use client'

/**
 * The native danger map, configured for the root landing page's directory rather than a center's
 * own home page: no search or geolocate chrome, framed on the center's zones, travel advice on.
 *
 * `centerId` is a sentinel that matches no NAC center on purpose. The map treats a zone whose
 * center id differs from its own as another center's and keeps the zone's upstream link, which
 * is the center's own forecast page — exactly where a directory should send people. A real id
 * would rewrite the link to an AvyWeb path that does not exist on the root domain.
 */
import { DangerMapLoader } from '@/components/dangerMap/DangerMapLoader.client'
import {
  DANGER_MAP_DEFAULTS,
  type DangerMapSettings,
} from '@/services/nac/dangerMap/dangerMapSettings'

const DIRECTORY_CENTER_ID = 'avyweb-directory'

const DIRECTORY_SETTINGS: DangerMapSettings = {
  ...DANGER_MAP_DEFAULTS,
  search: false,
  geolocate: false,
  advice: true,
  allCenters: false,
  center: null,
}

interface DirectoryMapProps {
  centerSlug: string
  className?: string
}

export function DirectoryMap({ centerSlug, className }: DirectoryMapProps) {
  return (
    <div className={className}>
      <DangerMapLoader
        centerSlug={centerSlug}
        centerId={DIRECTORY_CENTER_ID}
        settings={DIRECTORY_SETTINGS}
      />
    </div>
  )
}
